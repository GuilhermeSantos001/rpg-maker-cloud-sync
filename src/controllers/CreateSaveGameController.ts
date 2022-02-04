import { SaveData } from '@prisma/client';
import { Request, Response } from 'express';
import { compressToBase64 } from 'lz-string';

import { prismaClient } from '../database/PrismaClient';
import { CreateThrowErrorController } from './CreateThrowErrorController';

export class CreateSaveGameController {
  async handle(request: Request, response: Response) {
    const {
      gameId,
      gameToken,
      playerId,
      saveNum,
      compatibilityVersion,
      data
    }: Pick<SaveData,
      | 'gameId'
      | 'gameToken'
      | 'playerId'
      | 'saveNum'
      | 'compatibilityVersion'
      | 'data'
    > = request.body;

    const createThrowErrorController = new CreateThrowErrorController();

    return response.json(await createThrowErrorController.handle<SaveData>(
      prismaClient.saveData.create({
        data: {
          gameId: compressToBase64(gameId),
          gameToken: compressToBase64(gameToken),
          playerId: compressToBase64(playerId),
          saveNum,
          compatibilityVersion,
          data
        }
      }),
      'Não foi possível criar o save game.'
    ));
  }
}