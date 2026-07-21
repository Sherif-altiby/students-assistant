import { Request, Response, NextFunction } from "express";
import { chatService } from "./chat.service";
import { getHistorySchema } from "./chat.schema";

export const chatController = {
  async getHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const { cursor, limit } = getHistorySchema.parse(req.query);
      const messages = await chatService.getHistory(cursor, limit);
      res.status(200).json({ success: true, data: messages });
    } catch (err) {
      next(err);
    }
  },
};