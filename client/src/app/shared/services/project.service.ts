import { Injectable } from '@angular/core';
import { Http, Headers, RequestOptions, Response } from '@angular/http';

import { Observable } from 'rxjs';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { TreeNode } from 'primeng/primeng';

import { ConstsService } from './consts.service';
import { AuthenticationService } from './authentication.service';

@Injectable()
export class ProjectService {
  private serverUrl: string;
  public bJProjectsTree = new BehaviorSubject<any>(null);
  private user: any;

  constructor(private http: Http, public options: RequestOptions, private constsService: ConstsService, private authService: AuthenticationService) {
    let headers = new Headers({ 'Content-Type': 'application/json', withCredentials: true });
    this.options.headers = headers;
    this.serverUrl = this.constsService.getServerUrl();

    this.user = this.authService.getCurrentUser();


    this.getJstreeProjectsByUser(this.user.id)
      .subscribe((tree) => {
        this.setCurrentProjectTree(tree);
      },
      (error) => console.log(error)
    )
      
  }

  addFolder(projectId, parentId, folderName) {
    return this.http.post(this.serverUrl + 'project/addFolder', { projectId: projectId, parentId: parentId, name: folderName }, this.options).map(this.extractData);
  }

  tnodeToTreeNode(node): TreeNode {
    let treeNode: TreeNode = {
      label: node.name,
      data: node,
      children: node.nodes? node.nodes: node.childs,
      leaf: (node.type === "folder" || !node.type) ? false: true,
    };
    return treeNode
  }

  buildTNode(node): TreeNode {
    for (let i in node.childs) {
      node.childs[i] = this.tnodeToTreeNode(node.childs[i]);
    }
    return this.tnodeToTreeNode(node);
  }

  buildProjectTree(nodes): TreeNode[] | TreeNode {
    // the function gets an array of tnodes and return an array of TreeNode
    if (Array.isArray(nodes)) {
      let treeNodes: TreeNode[] = [];
    
      nodes.forEach((node) => {
        for (let i in node.nodes) {
          node.nodes[i] = this.tnodeToTreeNode(node.nodes[i]);
        }
  
        treeNodes.push(this.tnodeToTreeNode(node));
      })
      return treeNodes;
    }
    return this.tnodeToTreeNode(nodes)
    
  }

  createProject(projectName) {
    return this.http.post(this.serverUrl + 'project/createProject', { name: projectName }, this.options).map(this.extractData);
  }

  deleteFolder(id) {
    return this.http.post(this.serverUrl + 'project/deleteFolder', { id: id }, this.options).map(this.extractData);
  }

  deleteProject(projectId) {
    return this.http.get(this.serverUrl + 'project/deleteProject/' + projectId, this.options).map(this.extractData);
  }

  getProjectById(projectId) {
    return this.http.get(this.serverUrl + 'project/getProjectById/' + projectId, this.options).map(this.extractData);
  }

  getJstreeProjectsByUser(userId) {
    return this.http.get(this.serverUrl + 'project/getJstreeProjectsByUser/' + userId, this.options).map(this.extractData);
  }

  getNode(id: any) {
    return this.http.get(this.serverUrl + 'project/node/'+id, this.options).map(this.extractData);
  }

  getCurrentProjectTree() {
    return this.bJProjectsTree;
  }
  
  getProjectsByUser(userId) {
    return this.http.get(this.serverUrl + 'project/getProjectByUser/' + userId, this.options).map(this.extractData);
  }

  getTNode(nodeId: string) {
    return this.http.get(this.serverUrl + 'projects/tnode/' + nodeId, this.options).map((res) => {
      console.log(res.json());
      let node = this.buildTNode(res.json());
      return node;
    })
  }

  getTnodes() {
    return this.http.get(this.serverUrl + 'projects', this.options).map(res => {
      return this.buildProjectTree(res.json());
    })
  }

  getProjectMaps(projectId) {
    return this.http.get(this.serverUrl + 'projects/' + projectId + '/maps').map(res => res.json())
  }
  
  setCurrentProjectTree(tree) {
    this.bJProjectsTree.next(tree);
  }

  renameFolder(id, name) {
    return this.http.post(this.serverUrl + 'project/renameFolder', { id: id, name: name }, this.options).map(this.extractData);
  }

  updateProject(projectId, project) {
    //TODO: create rename function for projects at the server
    return this.http.post(this.serverUrl + 'projects/' + projectId + '/update', project)
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
