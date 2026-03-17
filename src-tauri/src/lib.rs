use std::process::{Command, Child, Stdio};
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;
use std::sync::{Arc, Mutex};
use std::io::{BufRead, BufReader};
use tauri::Manager;


#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct HostnameEntry {
    pub hostname: String,
    pub ip: String,
    pub active: bool,
}

#[derive(Deserialize, Debug)]
pub struct TerminalArgs {
    pub path: String,
    pub command: String,
    #[serde(rename = "integratedEditor")]
    pub integrated_editor: Option<String>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
struct VSCodeTask {
    label: String,
    #[serde(rename = "type")]
    task_type: String,
    command: String,
    #[serde(rename = "runOptions")]
    run_options: VSCodeRunOptions,
    presentation: VSCodePresentation,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
struct VSCodeRunOptions {
    #[serde(rename = "runOn")]
    run_on: String,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
struct VSCodePresentation {
    reveal: String,
    panel: String,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
struct VSCodeTasksConfig {
    version: String,
    tasks: Vec<VSCodeTask>,
}

fn prepare_vscode_tasks(project_path: &str, command: String) -> Result<(), String> {
    let p = Path::new(project_path);
    // Determine the base directory for .vscode
    let base_dir = if p.is_file() {
        p.parent().unwrap_or(p)
    } else {
        p
    };
    
    let vscode_dir = base_dir.join(".vscode");
    let tasks_file = vscode_dir.join("tasks.json");

    if !vscode_dir.exists() {
        fs::create_dir_all(&vscode_dir).map_err(|e| format!("Failed to create .vscode dir: {}", e))?;
    }

    let mut config = if tasks_file.exists() {
        let content = fs::read_to_string(&tasks_file).map_err(|e| format!("Failed to read tasks.json: {}", e))?;
        serde_json::from_str::<VSCodeTasksConfig>(&content).unwrap_or_else(|_| VSCodeTasksConfig {
            version: "2.0.0".to_string(),
            tasks: vec![],
        })
    } else {
        VSCodeTasksConfig {
            version: "2.0.0".to_string(),
            tasks: vec![],
        }
    };

    let nexo_task = VSCodeTask {
        label: "Nexo: Auto-run".to_string(),
        task_type: "shell".to_string(),
        command,
        run_options: VSCodeRunOptions { run_on: "folderOpen".to_string() },
        presentation: VSCodePresentation { reveal: "always".to_string(), panel: "new".to_string() },
    };

    // Remove existing nexo task if present to avoid duplicates
    config.tasks.retain(|t| t.label != "Nexo: Auto-run");
    config.tasks.push(nexo_task);

    let json = serde_json::to_string_pretty(&config).map_err(|e| format!("Failed to serialize tasks.json: {}", e))?;
    fs::write(tasks_file, json).map_err(|e| format!("Failed to write tasks.json: {}", e))?;

    Ok(())
}

#[tauri::command]
fn open_ide(path: String, editor: String) -> Result<(), String> {
    println!("Backend: open_ide called. editor='{}', path='{}'", editor, path);

    if cfg!(target_os = "macos") {
        let app_name = match editor.as_str() {
            "code" => Some("Visual Studio Code"),
            "cursor" => Some("Cursor"),
            "zed" => Some("Zed"),
            "subl" => Some("Sublime Text"),
            "intellij" => Some("IntelliJ IDEA"),
            "antigravity" => Some("Antigravity"),
            "vs" => Some("Visual Studio"),
            _ => None,
        };

        if let Some(app) = app_name {
            Command::new("open")
                .arg("-a")
                .arg(app)
                .arg(&path)
                .spawn()
                .map_err(|e| format!("Failed to open {} via open -a: {}", app, e))?;
            return Ok(());
        }
    }

    // Fallback/Windows
    let editor_bin = match editor.as_str() {
        "cursor" => { if cfg!(target_os = "windows") { "cursor.cmd" } else { "cursor" } },
        "code" => { if cfg!(target_os = "windows") { "code.cmd" } else { "code" } },
        "antigravity" => "antigravity",
        _ => &editor,
    };

    Command::new(editor_bin)
        .arg(&path)
        .spawn()
        .map_err(|e| format!("Failed to open IDE {}: {}", editor_bin, e))?;
    Ok(())
}

#[tauri::command]
fn run_terminal_command(args: TerminalArgs) -> Result<(), String> {
    println!("Backend: run_terminal_command received: {:?}", args);

    if let Some(editor) = args.integrated_editor {
        if editor == "code" || editor == "cursor" || editor == "antigravity" {
            println!("Backend: Preparing tasks.json for {}", editor);
            prepare_vscode_tasks(&args.path, args.command)?;
            return Ok(());
        }
        
        // Non-VSCode integrated fallback (unsupported for now, just skips external)
        println!("Backend: Integrated requested for {} but not supported via tasks.json yet. Skipping.", editor);
        return Ok(());
    }

    // --- EXTERNAL TERMINAL ---
    if cfg!(target_os = "macos") {
        let p = Path::new(&args.path);
        let exec_dir = if p.is_file() { p.parent().unwrap_or(p).to_str().unwrap_or(&args.path) } else { &args.path };

        let script = format!(
            "tell application \"Terminal\"\n\
             activate\n\
             if (count of windows) is 0 then\n\
                do script \"cd \" & quoted form of \"{}\" & \" && {}\"\n\
             else\n\
                tell application \"System Events\" to keystroke \"t\" using command down\n\
                delay 0.2\n\
                do script \"cd \" & quoted form of \"{}\" & \" && {}\" in window 1\n\
             end if\n\
             end tell",
            exec_dir, args.command, exec_dir, args.command
        );
        Command::new("osascript").arg("-e").arg(script).spawn().ok();
    } else if cfg!(target_os = "windows") {
        let p = Path::new(&args.path);
        let exec_dir = if p.is_file() { p.parent().unwrap_or(p).to_str().unwrap_or(&args.path) } else { &args.path };

        let has_wt = Command::new("where").arg("wt.exe").output().map(|o| o.status.success()).unwrap_or(false);
        if has_wt {
            Command::new("wt").args(["nt", "-d", exec_dir, "cmd", "/K", &args.command]).spawn().ok();
        } else {
            Command::new("cmd").args(["/C", "start", "cmd", "/K", &format!("cd /d \"{}\" && {}", exec_dir, args.command)]).spawn().ok();
        }
    }
    Ok(())
}

#[derive(Serialize, Deserialize, Debug, Clone)]
struct ActivePort {
    port: String,
    process: String,
    pid: String,
}

#[tauri::command]
fn get_active_ports() -> Vec<ActivePort> {
    let mut active_ports = Vec::new();

    if cfg!(target_os = "macos") {
        let output = Command::new("lsof")
            .args(["-iTCP", "-sTCP:LISTEN", "-P", "-n"])
            .output();

        if let Ok(out) = output {
            let s = String::from_utf8_lossy(&out.stdout);
            let lines: Vec<&str> = s.lines().collect();
            // Skip header
            for line in lines.iter().skip(1) {
                let parts: Vec<&str> = line.split_whitespace().collect();
                if parts.len() >= 9 {
                    let process = parts[0].to_string();
                    let pid = parts[1].to_string();
                    let name = parts[8]; // e.g., *:1420 or [::1]:1420
                    let port = name.split(':').last().unwrap_or("").to_string();
                    
                    if !port.is_empty() {
                        active_ports.push(ActivePort { port, process, pid });
                    }
                }
            }
        }
    } else if cfg!(target_os = "windows") {
        let output = Command::new("cmd")
            .args(["/C", "netstat -ano | findstr LISTENING"])
            .output();

        if let Ok(out) = output {
            let s = String::from_utf8_lossy(&out.stdout);
            for line in s.lines() {
                let parts: Vec<&str> = line.split_whitespace().collect();
                if parts.len() >= 5 {
                    let addr = parts[1];
                    let port = addr.split(':').last().unwrap_or("").to_string();
                    let pid = parts[4].to_string();
                    
                    // Get process name using tasklist
                    let p_output = Command::new("tasklist")
                        .args(["/FI", &format!("PID eq {}", pid), "/NH", "/FO", "CSV"])
                        .output();
                    
                    let mut process = "Unknown".to_string();
                    if let Ok(p_out) = p_output {
                        let p_s = String::from_utf8_lossy(&p_out.stdout);
                        if let Some(p_line) = p_s.lines().next() {
                            process = p_line.split(',').next().unwrap_or("Unknown").replace("\"", "").to_string();
                        }
                    }

                    if !port.is_empty() {
                        active_ports.push(ActivePort { port, process, pid });
                    }
                }
            }
        }
    }

    // Sort by port
    active_ports.sort_by(|a, b| a.port.cmp(&b.port));
    active_ports.dedup_by(|a, b| a.port == b.port);
    active_ports
}

#[tauri::command]
fn kill_port_process(pid: String) -> Result<(), String> {
    if cfg!(target_os = "windows") {
        Command::new("taskkill")
            .args(["/F", "/PID", &pid])
            .status()
            .map_err(|e| e.to_string())?;
    } else {
        Command::new("kill")
            .args(["-9", &pid])
            .status()
            .map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
fn get_local_network_url(port: String) -> String {
    if let Ok(my_local_ip) = local_ip_address::local_ip() {
        return format!("http://{}:{}", my_local_ip, port);
    }
    "No se encontró IP".to_string()
}

#[tauri::command]
fn get_hostname_mappings() -> Result<Vec<HostnameEntry>, String> {
    let hosts_path = if cfg!(target_os = "windows") {
        Path::new(r"C:\Windows\System32\drivers\etc\hosts")
    } else {
        Path::new("/etc/hosts")
    };

    if !hosts_path.exists() {
        return Err("Hosts file not found".to_string());
    }

    let content = fs::read_to_string(hosts_path).map_err(|e| e.to_string())?;
    let mut entries = Vec::new();

    for line in content.lines() {
        if line.contains("# Nexo Managed") {
            let parts: Vec<&str> = line.split_whitespace().collect();
            if parts.len() >= 3 {
                entries.push(HostnameEntry {
                    ip: parts[0].to_string(),
                    hostname: parts[1].to_string(),
                    active: true,
                });
            }
        }
    }

    Ok(entries)
}

#[tauri::command]
async fn update_hostname_mapping(hostname: String, remove: bool, ip: String, target_port: Option<String>) -> Result<(), String> {
    let actual_path = if cfg!(target_os = "windows") {
        r"C:\Windows\System32\drivers\etc\hosts"
    } else {
        "/etc/hosts"
    };

    // 1. Leer y actualizar el archivo HOSTS
    let content = fs::read_to_string(actual_path).map_err(|e| format!("Error leyendo hosts: {}", e))?;
    let mut lines: Vec<String> = content.lines().map(|l| l.to_string()).collect();
    
    // Limpiamos entradas previas del mismo hostname para evitar duplicados
    lines.retain(|l| !l.contains(&hostname));

    if !remove {
        lines.push(format!("{} {} # Nexo Managed", ip, hostname));
    }

    let new_content = lines.join("\n") + "\n";
    let temp_path = std::env::temp_dir().join("nexo_hosts_tmp");
    fs::write(&temp_path, new_content).map_err(|e| e.to_string())?;

    // 2. Ejecutar comandos con privilegios elevados según el SO
    if cfg!(target_os = "macos") {
        let port = target_port.unwrap_or_else(|| "80".to_string());
        
        let script = if !remove {
            // Creamos un archivo temporal para las reglas de PF (Packet Filter)
            // La redirección (rdr) debe ir sobre la interfaz de loopback (lo0)
            format!(
                "do shell script \"cp '{temp}' '{hosts}' && \
                sysctl -w net.inet.ip.forwarding=1 && \
                echo 'rdr pass on lo0 inet proto tcp from any to {ip} port 80 -> 127.0.0.1 port {port}' > /tmp/nexo_pf.conf && \
                pfctl -ef /tmp/nexo_pf.conf\" with administrator privileges",
                temp = temp_path.display(),
                hosts = actual_path,
                ip = ip,
                port = port
            )
        } else {
            format!(
                "do shell script \"cp '{temp}' '{hosts}' && pfctl -d || true\" with administrator privileges",
                temp = temp_path.display(),
                hosts = actual_path
            )
        };

        Command::new("osascript").arg("-e").arg(script).status().map_err(|e| e.to_string())?;

    } else if cfg!(target_os = "windows") {
        let port = target_port.unwrap_or_else(|| "80".to_string());
        
        // En Windows usamos netsh interface portproxy
        // Esto redirige el tráfico que llega al puerto 80 de la IP hacia el localhost:puerto
        let powershell_cmd = if !remove {
            format!(
                "Start-Process powershell -ArgumentList '-Command \"\
                Copy-Item -Path ''{temp}'' -Destination ''{hosts}'' -Force; \
                netsh interface portproxy add v4tov4 listenport=80 listenaddress={ip} connectport={port} connectaddress=127.0.0.1\"' -Verb RunAs -Wait",
                temp = temp_path.display(),
                hosts = actual_path,
                ip = ip,
                port = port
            )
        } else {
            format!(
                "Start-Process powershell -ArgumentList '-Command \"\
                Copy-Item -Path ''{temp}'' -Destination ''{hosts}'' -Force; \
                netsh interface portproxy delete v4tov4 listenport=80 listenaddress={ip}\"' -Verb RunAs -Wait",
                temp = temp_path.display(),
                hosts = actual_path,
                ip = ip
            )
        };

        Command::new("powershell")
            .args(["-Command", &powershell_cmd])
            .status()
            .map_err(|e| e.to_string())?;
    }

    Ok(())
}


#[tauri::command]
fn get_installed_ides() -> Vec<String> {
    let mut ides_to_check = vec![
        "cursor", 
        "code",
        "zed", 
        "subl", 
        "intellij",
        "antigravity",
    ];
    
    if cfg!(target_os = "windows") {
        ides_to_check.push("devenv");
    }

    let mut installed = Vec::new();

    for ide in ides_to_check {
        // 1. Intento rápido con el PATH (System-wide)
        let cmd = if cfg!(target_os = "windows") { "where" } else { "which" };
        let exists_in_path = Command::new(cmd)
            .arg(ide)
            .status()
            .map(|s| s.success())
            .unwrap_or(false);

        if exists_in_path {
            installed.push(ide.to_string());
            continue; // Si lo encontró, saltamos al siguiente IDE
        }

        // 2. Búsqueda manual en rutas comunes de Windows
        if cfg!(target_os = "windows") {
            let local_app_data = std::env::var("LOCALAPPDATA").unwrap_or_default();
            let program_files = std::env::var("ProgramFiles").unwrap_or_default();
            let program_files_x86 = std::env::var("ProgramFiles(x86)").unwrap_or_default();

            let win_paths = match ide {
                "code" => vec![
                    format!(r"{}\Programs\Microsoft VS Code\bin\code.cmd", local_app_data),
                    format!(r"{}\Microsoft VS Code\bin\code.cmd", program_files),
                ],
                "cursor" => vec![
                    format!(r"{}\Programs\cursor\resources\app\bin\cursor.cmd", local_app_data),
                    format!(r"{}\cursor\resources\app\bin\cursor.cmd", local_app_data),
                ],
                "devenv" => vec![
                    format!(r"{}\Microsoft Visual Studio\2022\Community\Common7\IDE\devenv.exe", program_files),
                    format!(r"{}\Microsoft Visual Studio\2022\Professional\Common7\IDE\devenv.exe", program_files),
                    format!(r"{}\Microsoft Visual Studio\2019\Community\Common7\IDE\devenv.exe", program_files_x86),
                ],
                "antigravity" => vec![
                    format!(r"{}\antigravity\antigravity.exe", local_app_data),
                ],
                _ => vec![],
            };

            for path in win_paths {
                if Path::new(&path).exists() {
                    installed.push(ide.to_string());
                    break;
                }
            }
        }

        // 3. Búsqueda manual en macOS
        if cfg!(target_os = "macos") {
            let mac_path = match ide {
                "cursor" => Some("/Applications/Cursor.app/Contents/Resources/app/bin/cursor"),
                "code" => Some("/Applications/Visual Studio Code.app/Contents/Resources/app/bin/code"),
                "zed" => Some("/Applications/Zed.app/Contents/MacOS/zed"),
                "subl" => Some("/Applications/Sublime Text.app/Contents/SharedSupport/bin/subl"),
                "antigravity" => Some("/Applications/Antigravity.app/Contents/MacOS/antigravity"),
                _ => None,
            };

            if let Some(p) = mac_path {
                if Path::new(p).exists() {
                    installed.push(ide.to_string());
                }
            }
        }
    }

    installed.sort();
    installed.dedup();
    installed
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.show();
                let _ = window.set_focus();
            }
        }))
        .plugin(tauri_plugin_autostart::init(tauri_plugin_autostart::MacosLauncher::LaunchAgent, Some(vec!["--minimized"])))
        .invoke_handler(tauri::generate_handler![
            open_ide, 
            run_terminal_command, 
            get_installed_ides, 
            get_active_ports, 
            kill_port_process, 
            get_local_network_url,
            get_hostname_mappings,
            update_hostname_mapping
        ])
        .setup(|app| {
            #[cfg(target_os = "macos")]
            app.set_activation_policy(tauri::ActivationPolicy::Regular);
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
