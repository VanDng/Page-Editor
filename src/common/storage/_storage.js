import { Log } from '../log/es-log.js';

const _log = new Log('Storage');

export class Storage {
    #_setEventHandlers = [];
    #_removeEventHandler = [];
    #_partition = '';

    constructor(parition = '') {
        this.#_partition = parition;
    }

    Get(key) {
        let partitionedKey = this.#_partition + key;
        let partition = this.#_partition; // Funny fix huh?

        if (key == null) {
            partitionedKey = null;
        }

        return new Promise((resolve, reject) => {
            chrome.storage.local.get(partitionedKey, function(data) {
                for (const [keyResult, valueResult] of Object.entries(data)) {
                    if (keyResult.startsWith(partition)) {
                        let keyWithoutPartition = keyResult.substring(partition.length);
                        resolve({
                            key: keyWithoutPartition,
                            value: valueResult
                        });
                    }
                }
                resolve(null);
            });
        });
    }

    Set(key, value) {
        let partitionedKey = this.#_partition + key;

        let storageItem = {};
        storageItem[partitionedKey] = value;

        let refSetEventHandlers = this.#_setEventHandlers;

        return new Promise((resolve, reject) => {
            chrome.storage.local.set(storageItem, function() {

                refSetEventHandlers.forEach(async (handler) => {
                    handler?.(key, value);
                })

                resolve({
                    key: key,
                    value: value
                });

            });
        });
    }

    Remove(key) {
        let partitionedKey = this.#_partition + key;

        if (key == null) {
            partitionedKey = null;
        }

        let refRemoveEventHandler = this.#_removeEventHandler;

        return new Promise((resolve, reject) => {
            chrome.storage.local.get(partitionedKey, (value) => {
                chrome.storage.local.remove(partitionedKey, () => {

                    refRemoveEventHandler.forEach(async (handler) => {
                        handler?.(key, value);
                    })

                    resolve({
                        key: key,
                        value: value
                    });
                });
            });
        })
    }

    AddSetListener(handler) {
        this.#_setEventHandlers.push(handler);
    }

    AddRemoveListener(handler) {
        this.#_removeEventHandler.push(handler);
    }
}