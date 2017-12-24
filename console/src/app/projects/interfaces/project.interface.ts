import { IMap } from "../../maps/interfaces/map.interface";

export interface IProject {
  id?: string,
  _id?: string,
  name: string,
  description?: String,
  createdAt?: Date,
  updatedAt?: Date,
  archived?: boolean,
  maps?: [string] | [IMap]
}

