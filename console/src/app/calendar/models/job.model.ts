import { Project } from "../../projects/models/project.model";
import { Map } from "../../maps/models/map.model";

export class Job {
  project: string | Project;
  map: string | Map;
  type: string;
  date: Date;
  time: Date;
  cron: string;
  createdAt?: Date;
  updatedAt?: Date;
}

