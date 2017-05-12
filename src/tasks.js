export const tasks = {};

export default function registerTask(moduleName, name, handler) {
  tasks[`${moduleName}.${name}`] = handler;
}

export function registerTaskOverrides(moduleName, overrides) {
  Object.keys(overrides).forEach((override) => {
    let handler;

    if (tasks[`${moduleName}.${overrides[override]}`]) {
      handler = tasks[`${moduleName}.${overrides[override]}`];
    } else if (tasks[overrides[override]]) {
      handler = tasks[overrides[override]];
    } else {
      console.log(`Handler ${overrides[override]} in module ${moduleName}`);
      console.log(`to override ${override} does not exist`);
    }
    tasks[override] = handler;
  });
}
