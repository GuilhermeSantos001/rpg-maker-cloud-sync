import { Request, Response } from 'express';

import { prismaClient } from '../database/PrismaClient';
import { DeleteThrowErrorController } from './DeleteThrowErrorController';

export class DeleteSaveGameController {
    async handle(request: Request, response: Response) {
        const {
          id
        } = request.params;

        const deleteThrowErrorController = new DeleteThrowErrorController();

        return response.json(await deleteThrowErrorController.handle(
            prismaClient.saveData.delete({
                where: {
                  id
                }
              }),
            'Não foi possível deletar o save game.'
        ));
    }
}