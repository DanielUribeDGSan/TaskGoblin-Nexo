export interface CommandSnippet {
  id: string;
  title: string;
  commands: string[];
}

export interface EnvVariable {
  id: string;
  key: string;
  value: string;
}

export interface EnvProfile {
  id: string;
  title: string;
  variables: EnvVariable[];
}
