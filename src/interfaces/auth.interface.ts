export interface IAdmin {
  id: number;
  name: string;
  username: string;
  password: string;
  isSuperAdmin: boolean;
}

export interface IPayloadAdmin {
  id: number;
  username: string;
}
