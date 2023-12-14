import { YakError } from "./error.ts";

const display_errors = (errors: YakError[]) => {
  errors.forEach((error) => {
    console.log(error.toString());
  });
};

export { display_errors };
