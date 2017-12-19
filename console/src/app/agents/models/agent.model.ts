import { IAgent } from "../interfaces/agent.interface";

export class Agent implements IAgent{
  name?: string;
  url: string;
  key: string;
  sshKey?: string;
  attributes: [any];
}
