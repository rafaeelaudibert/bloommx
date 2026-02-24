import { createChecker, checkEmail } from "./bloom";
import { data, m, k } from "../generated/micro";

const checker = createChecker(data, m, k);

export function isFreeEmail(email: string): boolean {
  return checkEmail(checker, email);
}

export function isFreeDomain(domain: string): boolean {
  return checker(domain.toLowerCase().trim());
}
