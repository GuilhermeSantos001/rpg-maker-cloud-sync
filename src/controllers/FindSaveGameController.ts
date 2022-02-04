import { SaveData } from '@prisma/client';
import { Request, Response } from 'express';

import { prismaClient } from '../database/PrismaClient';
import { FindThrowErrorController } from './FindThrowErrorController';

export class FindSaveGameController {
  async handle(request: Request, response: Response) {
    const { id } = request.params;

    const findThrowErrorController = new FindThrowErrorController();

    return response.json(await findThrowErrorController.handle<SaveData | null>(
      prismaClient.saveData.findFirst({
        where: {
          id
        }
      }),
      'Não foi possível retornar o save game.'
    ));
  }
}