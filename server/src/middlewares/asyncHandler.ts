import { Request, Response } from "express";

export const asyncHandler = (fn: (req: Request, res: Response) => Promise<void>) => {
  return (req: Request, res: Response, next: (err: Error) => void) => {
    fn(req, res).catch(next);
  };
};
