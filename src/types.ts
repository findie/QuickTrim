declare module '*.scss' {
  const content: ({ [s: string]: string });
  export = content;
}

declare module '*.css' {
  const content: ({ [s: string]: string });
  export = content;
}