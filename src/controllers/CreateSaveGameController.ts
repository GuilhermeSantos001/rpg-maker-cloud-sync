import { SaveData } from '@prisma/client';
import { Request, Response } from 'express';

import { prismaClient } from '../database/PrismaClient';
import { CreateThrowErrorController } from './CreateThrowErrorController';
import { ResponseThrowErrorController } from './ResponseThrowErrorController';

export class CreateSaveGameController {
  async handle(request: Request, response: Response) {
    const {
      gameId,
      gameToken,
      playerId,
      type,
      saveNum,
      compatibilityVersion,
      data
    }: Pick<SaveData,
      | 'gameId'
      | 'gameToken'
      | 'playerId'
      | 'type'
      | 'saveNum'
      | 'compatibilityVersion'
      | 'data'
    > = request.body;

    const createThrowErrorController = new CreateThrowErrorController();
    const responseThrowErrorController = new ResponseThrowErrorController();

    if (await prismaClient.saveData.findFirst({
      where: {
        gameId,
        gameToken,
        playerId,
        type,
        saveNum,
        compatibilityVersion
      }
    }))
      return responseThrowErrorController.handle(
        new Error("Save already exists"),
        'Retry with a different saveNum or compatibilityVersion',
      )

    return response.json(await createThrowErrorController.handle<SaveData>(
      prismaClient.saveData.create({
        data: {
          gameId,
          gameToken,
          playerId,
          type,
          saveNum,
          compatibilityVersion,
          data
        }
      }),
      'Não foi possível criar o save game.'
    ));
  }
}