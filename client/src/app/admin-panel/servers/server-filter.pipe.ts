import { Pipe, PipeTransform } from '@angular/core';

import * as _ from 'lodash';

@Pipe({
  name: 'serverFilter'
})
export class ServerFilterPipe implements PipeTransform {

    filterByAttribute(attr: string, searchString: string, servers: any[]) {
    let filteredServers = [];
    _.each(servers, (server) => {
      if (!server.attributes || server.attributes.length === 0) {
        return;
      } else {
        _.each(server.attributes, (attribute: any) => {
          if (attribute.name.includes(attr) && attribute.value.includes(searchString)) {
            filteredServers.push(server);
          }
        });
      }
    });
    return filteredServers;
  }

  filterByTerm(filterTerm: string, searchString: string, servers: any[]) {
    let filteredServers = [];
    _.each(servers, (server) => {
      if (!server[filterTerm]) {
        return;
      } else if (server[filterTerm].includes(searchString)) {
        filteredServers.push(server);
      }
    });
    return filteredServers;
  }


  transform(servers: any[], search: any): any {
    let filteredServers = [];
    let filterTerm: string;

    if (search.type === 0 || !search.text || search.text === '') {
      return servers;
    }

    if (search.type === 1) {
      filterTerm = 'name';
    }

    if (search.type === 2) {
      filterTerm = 'arch';
    }

    if (search.type === 3) {
      filteredServers = this.filterByAttribute(search.attrName, search.text, servers);
    } else {
      filteredServers = this.filterByTerm(filterTerm, search.text, servers);
    }

    return filteredServers;

  }

}
