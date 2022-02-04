import { Router } from 'express';

const router = Router({
  strict: true,
  caseSensitive: true
});

import APIMiddleware from '../../middlewares/api-middleware';

import { Router404Controller } from '../../controllers/Router404Controller';

import { CreateSaveGameController } from '../../controllers/CreateSaveGameController';
import { UpdateSaveGameController } from '../../controllers/UpdateSaveGameController';
import { FindSaveGameController } from '../../controllers/FindSaveGameController';
import { FindAllSavesGameController } from '../../controllers/FindAllSavesGameController';
import { DeleteSaveGameController } from '../../controllers/DeleteSaveGameController';

const router404Controller = new Router404Controller();

const createSaveGame = new CreateSaveGameController();
const updateSaveGame = new UpdateSaveGameController();
const findSaveGame = new FindSaveGameController();
const findAllSavesGame = new FindAllSavesGameController();
const deleteSaveGame = new DeleteSaveGameController();

router.use(APIMiddleware);

router.post('/savegame', createSaveGame.handle);
router.put('/savegame/:id', updateSaveGame.handle);
router.get('/savegame/:id', findSaveGame.handle);
router.get('/savesgame/:gameId/:gameToken', findAllSavesGame.handle);
router.delete('/savegame/:id', deleteSaveGame.handle);

router.use(router404Controller.handle);

export { router as APIRouter};