import { IAgent } from "../../agents/interfaces/agent.interface";

export interface IMap {
  id?: string,
  name: string,
  description?: string,
  createdAt: Date,
  licence?: string,
  archived: boolean,
  agents?: [IAgent]
}
