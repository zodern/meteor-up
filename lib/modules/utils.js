
export function runTaskList(list, sessions) {
  return new Promise((resolve, reject) => {
    list.run(sessions, summaryMap => {
      for (var host in summaryMap) {
        const summary = summaryMap[host];
        if (summary.error) {
          reject(summary.error);
          return;
        }
      }

      resolve();
    });
  });
}
