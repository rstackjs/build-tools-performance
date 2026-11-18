declare module '*.svg' {
  const url: string;
  export default url;
}
declare module '*.module.css' {
  const classes: Readonly<Record<string, string>>;
  export default classes;
}
declare module '*.css';
