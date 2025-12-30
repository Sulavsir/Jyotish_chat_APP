declare module 'cookie-parser' {
  import { RequestHandler } from 'express';
  
  function cookieParser(
    secret?: string | string[],
    options?: cookieParser.CookieParseOptions
  ): RequestHandler;
  
  namespace cookieParser {
    interface CookieParseOptions {
      decode?: (val: string) => string;
    }
  }
  
  export = cookieParser;
}


