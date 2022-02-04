import { SaveData } from '@prisma/client';
import { Request, Response } from 'express';

import { prismaClient } from '../database/PrismaClient';
import { UpdateThrowErrorController } from './UpdateThrowErrorController';

export class UpdateSaveGameController {
  async handle(request: Request, response: Response) {
    const
      { id } = request.params,
      {
        data
      }: Pick<SaveData,
        | 'data'
      > = request.body;

    const updateThrowErrorController = new UpdateThrowErrorController();

    return response.json(await updateThrowErrorController.handle<SaveData>(
      prismaClient.saveData.update({
        where: {
          id,
        },
        data: {
          data
        }
      }),
      'Não foi possível atualizar o save game.'
    ));
  }
}