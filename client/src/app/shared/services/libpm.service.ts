import { Injectable } from '@angular/core';
import { Http, Headers, RequestOptions } from '@angular/http';
import { Response } from '@angular/http';
import { ConstsService } from './consts.service';

declare const monaco: any;
declare const require: any;

@Injectable()
export class LibPMService {
    private serverUrl: string;
    private libs: Object = {};
    private mapLibPath: string = 'productionMap/map.d.ts';

    constructor(private http: Http, public options: RequestOptions, private constsService: ConstsService) {
        let headers = new Headers({ 'Content-Type': 'application/json', withCredentials: true });
        this.options.headers = headers;
        this.serverUrl = this.constsService.getServerUrl();
        this.libs = {};
        let onGotAmdLoader = () => {
            // Load monaco
            (<any>window).require.config({ paths: { 'vs': 'assets/vs' } });
            (<any>window).require(['vs/editor/editor.main'], () => {
                monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
                    target: monaco.languages.typescript.ScriptTarget.ES6,
                    allowNonTsExtensions: true,

                });
            });
        };

        // Load AMD loader if necessary
        if (!(<any>window).require) {
            let loaderScript = document.createElement('script');
            loaderScript.type = 'text/javascript';
            loaderScript.src = 'assets/vs/loader.js';
            loaderScript.addEventListener('load', onGotAmdLoader);
            document.body.appendChild(loaderScript);
        } else {
            onGotAmdLoader();
        }

    }

    getMonacoObject() {
        return monaco;
    }

    getLibPM() {
        return this.http.get(this.serverUrl + 'libs/lib_production_map.js', this.options).map(this.extractData);
    }

    addMap(map) {
        if (this.libs[this.mapLibPath]) {
            this.libs[this.mapLibPath].dispose();
        }
        let mapDefinition = 'let map = ';
        let mapContent: string = [mapDefinition, JSON.stringify({
            attributes: map.attributes,
            nodes: map.nodes,
            links: map.links
        }), ';'].join('');

        this.libs[this.mapLibPath] = monaco.languages.typescript.javascriptDefaults.addExtraLib(mapContent, this.mapLibPath);
    }

    removeAllLibs() {
        this.libs[this.mapLibPath].dispose();
        console.log('deleted libs');
    }

    private extractData(res: Response) {
        return res.text() || '';
    }
}
