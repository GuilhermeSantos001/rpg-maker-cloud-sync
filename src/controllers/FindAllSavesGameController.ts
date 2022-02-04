import { SaveData } from '@prisma/client';
import { Request, Response } from 'express';

import { prismaClient } from '../database/PrismaClient';
import { FindThrowErrorController } from './FindThrowErrorController';

export class FindAllSavesGameController {
  async handle(request: Request, response: Response) {
    const
      { gameId, gameToken } = request.params,
      {
        skip,
        take,
      } = request.query;

    const findThrowErrorController = new FindThrowErrorController();

    return response.json(await findThrowErrorController.handle<SaveData[] | null>(
      prismaClient.saveData.findMany({
        where: {
          gameId,
          gameToken,
        },
        skip: skip ? Number(skip) : undefined,
        take: take ? Number(take) : undefined
      }),
      'Não foi possível retornar os saves game.'
    ));
  }
}