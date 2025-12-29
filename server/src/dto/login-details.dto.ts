import { User } from "src/entities";

export class loginDetailsDto {
  allowed: boolean;
  user: User | null;
  manager?: User | null;
  isFirstLogin?: boolean;
  role?: string;

  /** Optional: only populated when allowed === false */
  reason?: string;
}
