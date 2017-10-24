module.exports = {

  ProjectToItem: function (project) {
    project.text = project.name;
    project.type = 'project';
    project.hasChildren = true;
    let children = [];
    project.nodes.forEach(function (node) {
      if (node.type == 'folder') {
        node.hasChildren = true;
      }
      children.push(node);
    });
    project.children = children;
  },
  MapToItem: function (node) {
    node.text = node.map.name;
    node.name = node.map.name;
    node.type = 'map';
    node.hasChildren = false;
    node.map.versionIndex = node.map.versions.length - 1;
    node.map.mapView = _.cloneDeep(node.map.versions[node.map.versionIndex].structure);
    delete node.map.versions;
    delete node.map.inspect;
  },
  FolderToItem: function (node) {
    node.hasChildren = true;
    node.text = node.name;
    node.type = 'folder';
  }
};
