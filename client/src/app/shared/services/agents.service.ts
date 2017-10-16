import { Injectable } from '@angular/core';
import { Http, Headers, RequestOptions } from '@angular/http';
import { Response } from '@angular/http';
import { ConstsService } from './consts.service';
import * as _ from 'lodash';

@Injectable()
export class AgentsService {
    private blocks: any = [];
    private dragBlocks: any = [];
    private blocksNames: any = {};
    private dedicatedTypes: any = [];

    private serverUrl: string;

    constructor(private http: Http, public options: RequestOptions, private constsService: ConstsService) {
        let headers = new Headers({ 'Content-Type': 'application/json', withCredentials: true });
        this.options = new RequestOptions({ headers: headers });
        this.serverUrl = this.constsService.getServerUrl();
    }

    uploadFile(uploadUrl, file) {
        let fd = new FormData();
        /* Take the first selected file */
        fd.append('file', file);

        return this.http.post(this.serverUrl + '/registerAgent', fd, this.options).map(this.extractData);
    }

    all(cb) {
        if (cb === true) {
            return this.dedicatedTypes;
        } else if (cb === "blocks") {
            return this.blocks;
        } else if (cb == "dragblocks") {
            return this.dragBlocks;
        }
        this.blocks.splice(0, this.blocks.length);
        this.dragBlocks.splice(0, this.dragBlocks.length);
        this.dedicatedTypes.splice(0, this.dedicatedTypes.length);
        return this.http.get(this.serverUrl + 'getallagents').map(this.extractData).map(
            (msg) => {
                _.forEach(msg, (value) => {
                    this.blocks.push(value);
                });
                _.forEach(this.blocks, (block: any) => {
                    this.dragBlocks.push({
                        img_url: block.imgUrl,
                        text: block.type
                    });
                    this.dedicatedTypes.push({
                        type: block.type,
                        url: ''
                    });
                });
                return {
                    servers: this.blocks,
                    blocks: this.dragBlocks
                };
            }
        );
    }


        remove(agent) {
            _.forEach(this.blocks, (key, block) => {
                if (block === agent.type) {
                    this.blocks.splice(key, 1);
                }
            });

            _.forEach(this.dedicatedTypes, (key: string, block: any) => {
                if (block.type === agent.type) {
                    this.dedicatedTypes.splice(key, 1);
                }
            });

            _.forEach(this.dragBlocks, (key: string, block: any) => {
                if (block.type === agent.type) {
                    this.dragBlocks.splice(key, 1);
                }
            });

            /* remove from server */
            return this.http.delete(this.serverUrl + 'dedicatedAgent/' + agent.id).map(this.extractData);
        }
    get(type) {
        console.log(this.blocks);
        for (let block of this.blocks) {
            if (block.type === type) {
                return block;
            }
        }
        return {};
    }
    getMethod(id) {
        return this.http.get(this.serverUrl + 'method/' + id);
    }
    getMethods(type) {
        let server = {
            methods: [],
            id: 0
        };
        for (let block in this.blocks) {
            if (this.blocks[block].type === type) {
                server = this.blocks[block];
            }
        }
        return this.http.get(this.serverUrl + 'dedicatedAgent/' + server.id).map(this.extractData);
    }

    /* deprecated don't use this function */
    add(type, methods, imgUrl, file, agents) {
        console.log('DEPRECATED: this function is no longer usable! use the appropriate upload object instead.');
        let server = {
            type: type,
            methods: methods,
            imgUrl: imgUrl
        };
        return this.http.post(this.serverUrl + 'dedicatedAgent', server).map((resData) => {
            this.blocks.push(server);
            agents.forEach(agent => {
                this.uploadFile(agent.url, file);
            });
            return resData;
        });
    }

    /* deprecated don't use this function */
    install(baseagent) {
        return this.http.post(this.serverUrl + 'BaseAgent/installAgent', baseagent).map(this.extractData);
    }

    newBlock(type) {
        if (this.blocksNames.hasOwnProperty(type)) {
            let res = this.blocksNames[type];
            this.blocksNames[type] = res + 1;
            return type + '' + res;
        } else {
            this.blocksNames[type] = 1;
            return type;
        }
    }
    private extractData(res: Response) {
        try {
            let body = res.json();
            return body || {};
        } catch (ex) {
            return {};
        }
    }
}
