//==================================================================================================
// GS001_CloudSync.js
//==================================================================================================
/*:
 * @plugindesc v1.00 - Cloud Sync Plugin
 *
 * @author GuilhermeSantos001
 *
 * @param GameID
 * @desc Exclusive ID for the game.
 * @type string
 * @default ???
 *
 * @param GameToken
 * @desc Secret token for access saves on the cloud.
 * @type string
 * @default ???
 *
 * @param CompatibilityVersion
 * @desc Compatibility version for the save on the cloud.
 * @type number
 * @default 1
 * @min 1
 *
 * @param Save Game Message 1
 * @desc Message to be displayed when the game is saved.
 * @type string
 * @default Saved on the cloud.
 *
 * @param Save Game Message 2
 * @desc Message to be displayed when the game is not saved.
 * @type string
 * @default Error on save on the cloud.
 *
 * @param Save Game Message 3
 * @desc Message to be displayed when the game is loaded.
 * @type string
 * @default Save game loaded from the cloud.
 *
 * @param Save Game Message 4
 * @desc Message to be displayed when the game is not loaded.
 * @type string
 * @default Error on load on the cloud.
 *
 * @param Save Game Message 5
 * @desc Message to be displayed when the game is updated.
 * @type string
 * @default Save game updated from the cloud.
 *
 * @param Save Game Message 6
 * @desc Message to be displayed when the game is not updated.
 * @type string
 * @default Error on updated on the cloud.
 *
 * @param Save Game Message 7
 * @desc Message to be displayed when the game is removed.
 * @type string
 * @default Save game removed from the cloud.
 *
 * @param Save Game Message 8
 * @desc Message to be displayed when the game is not removed.
 * @type string
 * @default Error on removed on the cloud.
 *
 * @help
 * ================================================================================
 *    Introduction
 * ================================================================================
 * Keep your game save files in the cloud.
 * ================================================================================
 *    Commands
 * ================================================================================
 * $gameTemp.cloudSyncSetPlayerId(playerId); - Set the player id.
 * -- default value: default
 *
 * $gameTemp.cloudSyncLoad(); - Load the game save from the cloud.
 * $gameTemp.cloudSyncFileRemove(saveNum); - Remove the game save from the cloud.
 *
 * -- saveNum:
 * -1 - Config file.
 * 0 - Global file.
 * 1 - Save file 1.
 * 2 - Save file 2.
 * 3 - Save file 3.
 * 4...
 * ================================================================================
 *    Github
 * ================================================================================
 * Keep the script up-to-date on Github.
 * https://github.com/GuilhermeSantos001/rpg-maker-cloud-sync
 */
(function () {
  "use strict";

  require('nw.gui').Window.get().showDevTools();

  //-----------------------------------------------------------------------------
  // Parameters
  //
  const params = PluginManager.parameters('GS001_CloudSync');
  const apiURI = 'https://rpg-maker-cloud-sync.herokuapp.com/api/v1';
  const apiAuthorization = '297820d4a89ba880c89cfd5b3c0cd294f8c90cc9a9e6c14c9684c04a592b68ad';
  const gameId = params['GameID'] || '???';
  const gameToken = params['GameToken'] || '???';
  const saveGameMessage1 = params['Save Game Message 1'] || 'Saved on the cloud.';
  const saveGameMessage2 = params['Save Game Message 2'] || 'Error on save on the cloud.';
  const saveGameMessage3 = params['Save Game Message 3'] || 'Save game loaded from the cloud.';
  const saveGameMessage4 = params['Save Game Message 4'] || 'Error on load on the cloud.';
  const saveGameMessage5 = params['Save Game Message 5'] || 'Save game updated from the cloud.';
  const saveGameMessage6 = params['Save Game Message 6'] || 'Error on updated on the cloud.';
  const saveGameMessage7 = params['Save Game Message 7'] || 'Save game removed from the cloud.';
  const saveGameMessage8 = params['Save Game Message 8'] || 'Error on removed on the cloud.';
  const compatibilityVersion = Number(params['CompatibilityVersion']) || 1;

  let playerId = 'default';

  let
    _CLOUD_SYNC_TEXT = '',
    _WINDOW_CLOUD_SYNC_IS_APPEND = false,
    _WINDOW_CLOUD_SYNC_IS_OPEN = false,
    _WINDOW_CLOUD_SYNC_IS_SHOW = false,
    _WINDOW_CLOUD_SYNC_IS_TIMEOUT = false,
    _WINDOW_CLOUD_SYNC_IS_TIMEOUT_MS = 3000;

  let
    _CLOUD_SYNC_QUEUE,
    _CLOUD_SYNC_LOADED = false,
    _CLOUD_SYNC_LOAD_DATA = [];

  const
    getHeadersForFetchPost = () => {
      var myHeaders = new Headers();

      myHeaders.append('Content-Type', 'application/json');
      myHeaders.append('Authorization', apiAuthorization);

      return myHeaders;
    },
    openWindowCloudSync = (text) => {
      _CLOUD_SYNC_TEXT = text;
      _WINDOW_CLOUD_SYNC_IS_OPEN = true;
    },
    getTypeSaveGame = (savefileId) => {
      switch (savefileId) {
        case -1: return 'config';
        case 0: return 'global';
        default: return 'file';
      }
    },
    saveGameResponseSuccess = (data) => {
      if (!data.success) {
        _CLOUD_SYNC_QUEUE.retry();
        console.error('Cloud Sync Error:', data);
        openWindowCloudSync(saveGameMessage2);
      }

      _CLOUD_SYNC_QUEUE.finish();
      openWindowCloudSync(saveGameMessage1);
    },
    saveGameResponseError = (error) => {
      _CLOUD_SYNC_QUEUE.retry();
      console.error('Cloud Sync Error:', error);
      openWindowCloudSync(saveGameMessage2);
    },
    updateGameResponseSuccess = (data) => {
      if (!data.success) {
        _CLOUD_SYNC_QUEUE.retry();
        console.error('Cloud Sync Error:', data);
        openWindowCloudSync(saveGameMessage6);
      }

      _CLOUD_SYNC_QUEUE.finish();
      openWindowCloudSync(saveGameMessage5);
    },
    updateGameResponseError = (error) => {
      _CLOUD_SYNC_QUEUE.retry();
      console.error('Cloud Sync Error:', error);
      openWindowCloudSync(saveGameMessage6);
    },
    loadGameResponseSuccess = (data) => {
      if (!data.success) {
        _CLOUD_SYNC_QUEUE.retry();
        console.error('Cloud Sync Error:', data);
        openWindowCloudSync(saveGameMessage4);
      }

      _CLOUD_SYNC_LOADED = true;
      _CLOUD_SYNC_LOAD_DATA = data.data;

      _CLOUD_SYNC_LOAD_DATA.forEach(save => {
        const
          savefileId = save.saveNum,
          json = LZString.decompressFromBase64(save.data);

        if (save.playerId == playerId) {
          StorageManager.save(savefileId, json);
        }
      });

      if (_CLOUD_SYNC_LOAD_DATA.length > 0)
        openWindowCloudSync(saveGameMessage3);

      _CLOUD_SYNC_QUEUE.finish();
    },
    loadGameResponseError = (error) => {
      _CLOUD_SYNC_QUEUE.retry();
      console.error('Cloud Sync Error:', error);
      openWindowCloudSync(saveGameMessage4);
    },
    removeGameResponseSuccess = (data) => {
      if (!data.success) {
        _CLOUD_SYNC_QUEUE.retry();
        console.error('Cloud Sync Error:', data);
        openWindowCloudSync(saveGameMessage8);
      }

      _CLOUD_SYNC_QUEUE.finish();
      openWindowCloudSync(saveGameMessage7);
    },
    removeGameResponseError = (error) => {
      _CLOUD_SYNC_QUEUE.retry();
      console.error('Cloud Sync Error:', error);
      openWindowCloudSync(saveGameMessage8);
    },
    saveGameFile = (gameId, gameToken, playerId, type, saveNum, data) => {
      fetch(`${apiURI}/savegame`, {
        method: 'POST', body: JSON.stringify({
          gameId,
          gameToken,
          playerId,
          type,
          saveNum,
          compatibilityVersion,
          data
        }), headers: getHeadersForFetchPost()
      })
        .then(response => response.json())
        .then((data) => saveGameResponseSuccess(data))
        .catch(error => saveGameResponseError(error));
    },
    updateGameFile = (id, data) => {
      fetch(`${apiURI}/savegame/${id}`, {
        method: 'PUT', body: JSON.stringify({
          data
        }), headers: getHeadersForFetchPost()
      })
        .then(response => response.json())
        .then((data) => updateGameResponseSuccess(data))
        .catch(error => updateGameResponseError(error));
    },
    loadGameFiles = (gameId, gameToken) => {
      fetch(`${apiURI}/savesgame/${gameId}/${gameToken}`, {
        method: 'GET', headers: getHeadersForFetchPost()
      })
        .then(response => response.json())
        .then((data) => loadGameResponseSuccess(data))
        .catch(error => loadGameResponseError(error));
    },
    removeGameFile = (id) => {
      fetch(`${apiURI}/savegame/${id}`, {
        method: 'DELETE', headers: getHeadersForFetchPost()
      })
        .then(response => response.json())
        .then((data) => removeGameResponseSuccess(data))
        .catch(error => removeGameResponseError(error));
    },
    saveLocalConfig = (data) => {
      if (StorageManager.isLocalMode()) {
        var fs = require('fs');
        var dirPath = StorageManager.localFileDirectoryPath();
        var filePath = StorageManager.localFileDirectoryPath() + "cloudsync.rpgsave";
        if (!fs.existsSync(dirPath)) {
          fs.mkdirSync(dirPath);
        }
        fs.writeFileSync(filePath, data);
      } else {
        var key = 'RPG CLOUD SYNC';
        localStorage.setItem(key, data);
      }
    },
    loadLocalConfig = () => {
      if (StorageManager.isLocalMode()) {
        var fs = require('fs');
        var filePath = StorageManager.localFileDirectoryPath() + "cloudsync.rpgsave";
        if (fs.existsSync(filePath)) {
          return fs.readFileSync(filePath, 'utf8');
        }
      } else {
        var key = 'RPG CLOUD SYNC';
        return localStorage.getItem(key);
      }

      return false;
    }

  //-----------------------------------------------------------------------------
  // Queue
  //
  class Queue {
    constructor() {
      this.queue = [];
      this.precessing = false;
    }

    process() {
      if (this.queue.length <= 0) return;
      if (this.precessing) return;

      console.log('Queue Process:', this.queue);

      this.precessing = true;

      const { type, value, options } = this.queue[0];

      if (options.retryCount >= options.retry)
        return this.finish();

      if (type == 'save')
        return saveGameFile(value.gameId, value.gameToken, value.playerId, value.type, value.saveNum, value.data);

      if (type == 'update')
        return updateGameFile(value.id, value.data);

      if (type == 'load')
        return loadGameFiles(value.gameId, value.gameToken);

      if (type == 'remove')
        return removeGameFile(value.id);

      return this.finish();
    }

    finish() {
      console.log('Queue Finish', this.queue[0]);
      this.queue.shift();
      this.precessing = false;
    }

    retry() {
      console.log('Queue Retry', this.queue[0]);
      this.queue[0].options.retryCount++;
      this.precessing = false;
    }

    push(type, value, options = { retry: 3, retryCount: 0 }) {
      this.queue.push({
        type,
        value,
        options
      });
    }
  }

  _CLOUD_SYNC_QUEUE = new Queue();

  //-----------------------------------------------------------------------------
  // Game_Temp
  //
  Game_Temp.prototype.cloudSyncSetPlayerId = (name) => {
    playerId = name;
    saveLocalConfig(LZString.compressToBase64(JSON.stringify({ playerId: name })));
  };

  Game_Temp.prototype.cloudSyncLoad = () => _CLOUD_SYNC_QUEUE.push('load', { gameId, gameToken });

  Game_Temp.prototype.cloudSyncFileRemove = (saveNum) => {
    _CLOUD_SYNC_LOAD_DATA.forEach(save => {
      if (save.saveNum == saveNum) {
        StorageManager.remove(saveNum);
        _CLOUD_SYNC_QUEUE.push('remove', { id: save.id });
      }
    })
  }

  //-----------------------------------------------------------------------------
  // StorageManager
  //
  const _storageManager_save = StorageManager.save;
  StorageManager.save = function (savefileId, json) {
    _storageManager_save.apply(this, arguments);

    var
      data = LZString.compressToBase64(json),
      type = getTypeSaveGame(savefileId);

    if (_CLOUD_SYNC_LOAD_DATA.length > 0) {
      const save = _CLOUD_SYNC_LOAD_DATA.find(save => save.compatibilityVersion == compatibilityVersion && save.type == type && save.saveNum == savefileId);

      if (save)
        return _CLOUD_SYNC_QUEUE.push('update', {
          id: save.id,
          data
        });
    }

    _CLOUD_SYNC_QUEUE.push('save', {
      gameId,
      gameToken,
      playerId,
      type,
      saveNum: savefileId,
      data
    });
  };

  //-----------------------------------------------------------------------------
  // Scene_Base
  //
  const _scene_base_initialize = Scene_Base.prototype.initialize;
  Scene_Base.prototype.initialize = function () {
    _scene_base_initialize.apply(this, arguments);
    if (!_CLOUD_SYNC_LOADED) {
      const localConfig = loadLocalConfig();

      if (localConfig) {
        const { playerId: _playerID } = JSON.parse(LZString.decompressFromBase64(localConfig));
        playerId = _playerID;
      }

      _CLOUD_SYNC_QUEUE.push('load', {
        gameId,
        gameToken
      });
    }
  };

  const _scene_base_update = Scene_Base.prototype.update;
  Scene_Base.prototype.update = function () {
    _scene_base_update.apply(this, arguments);
    _CLOUD_SYNC_QUEUE.process();
  };

  //-----------------------------------------------------------------------------
  // Scene_Map
  //
  const _sceneMap_update = Scene_Map.prototype.update;
  Scene_Map.prototype.update = function () {
    _sceneMap_update.apply(this, arguments);
    if (!this._cloudSyncWindow && _WINDOW_CLOUD_SYNC_IS_APPEND)
      _WINDOW_CLOUD_SYNC_IS_APPEND = false;

    if (_WINDOW_CLOUD_SYNC_IS_OPEN && !_WINDOW_CLOUD_SYNC_IS_TIMEOUT) {
      _WINDOW_CLOUD_SYNC_IS_TIMEOUT = true;
      let timeout = setTimeout(() => {
        _WINDOW_CLOUD_SYNC_IS_OPEN = false;
        _WINDOW_CLOUD_SYNC_IS_TIMEOUT = false;
        clearTimeout(timeout);
      }, _WINDOW_CLOUD_SYNC_IS_TIMEOUT_MS);
    }

    if (_WINDOW_CLOUD_SYNC_IS_APPEND) {
      if (_WINDOW_CLOUD_SYNC_IS_OPEN) {
        if (!_WINDOW_CLOUD_SYNC_IS_SHOW) {
          _WINDOW_CLOUD_SYNC_IS_SHOW = true;
          this._cloudSyncWindow.refresh();
          this._cloudSyncWindow.open();
        }
      } else {
        if (_WINDOW_CLOUD_SYNC_IS_SHOW) {
          _WINDOW_CLOUD_SYNC_IS_SHOW = false;
          this._cloudSyncWindow.close();
        }
      }
    }

    if (
      !_WINDOW_CLOUD_SYNC_IS_APPEND &&
      _WINDOW_CLOUD_SYNC_IS_OPEN
    ) {
      _WINDOW_CLOUD_SYNC_IS_APPEND = true;
      this._cloudSyncWindow = new Window_CloudSync(8);
      this._cloudSyncWindow.y = Graphics.boxHeight - (this._cloudSyncWindow.height + 8);
      this.addWindow(this._cloudSyncWindow);
    }
  };

  //-----------------------------------------------------------------------------
  // Window_CloudSync
  //
  function Window_CloudSync() {
    this.initialize.apply(this, arguments);
  }

  Window_CloudSync.prototype = Object.create(Window_Base.prototype);
  Window_CloudSync.prototype.constructor = Window_CloudSync;

  Window_CloudSync.prototype.initialize = function (x, y) {
    var width = this.windowWidth();
    var height = this.windowHeight();
    Window_Base.prototype.initialize.call(this, x, y, width, height);
    this.refresh();
  };

  Window_CloudSync.prototype.windowWidth = function () {
    return 400;
  };

  Window_CloudSync.prototype.windowHeight = function () {
    return this.fittingHeight(1);
  };

  Window_CloudSync.prototype.refresh = function () {
    var x = this.textPadding();
    var maxWidth = this.contents.width - this.textPadding() * 2;
    this.contents.clear();
    this.drawText(_CLOUD_SYNC_TEXT, x, 0, maxWidth, 'center');
  };
})();