// macOS process-tree snapshot. Run outside the measured process group.
#include <errno.h>
#include <inttypes.h>
#include <libproc.h>
#include <stdio.h>
#include <stdlib.h>
#include <sys/resource.h>

int main(int argc, char **argv) {
  if (argc != 2) return 1;
  pid_t root = (pid_t)strtol(argv[1], NULL, 10);
  if (root <= 0) return 1;
  int capacity = proc_listallpids(NULL, 0) + 1024;
  pid_t *pids = calloc(capacity, sizeof(*pids));
  struct proc_bsdinfo *info = calloc(capacity, sizeof(*info));
  int *selected = calloc(capacity, sizeof(*selected));
  if (!pids || !info || !selected) return 1;
  int count = proc_listallpids(pids, capacity * sizeof(*pids));
  if (count <= 0 || count >= capacity) return 1;
  for (int i = 0; i < count; i++) {
    if (proc_pidinfo(pids[i], PROC_PIDTBSDINFO, 0, &info[i], sizeof(info[i])) != sizeof(info[i])) continue;
    // The benchmark launches each command in its own process group. Include
    // reparented group members as well as descendants that create a new group.
    selected[i] = pids[i] == root || info[i].pbi_pgid == (uint32_t)root;
  }
  for (int changed = 1; changed;) {
    changed = 0;
    for (int i = 0; i < count; i++) {
      if (selected[i]) continue;
      for (int j = 0; j < count; j++) {
        if (selected[j] && info[i].pbi_ppid == (uint32_t)pids[j]) {
          selected[i] = 1;
          changed = 1;
          break;
        }
      }
    }
  }
  printf("[");
  int first = 1;
  for (int i = 0; i < count; i++) {
    if (!selected[i]) continue;
    rusage_info_current usage = {0};
    if (proc_pid_rusage(pids[i], RUSAGE_INFO_CURRENT, (rusage_info_t *)&usage)) {
      // A short-lived child can exit between enumeration and measurement.
      if (errno == ESRCH) continue;
      perror("proc_pid_rusage");
      return 1;
    }
    printf("%s{\"pid\":%d,\"bytes\":%" PRIu64 "}",
           first ? "" : ",", pids[i], usage.ri_phys_footprint);
    first = 0;
  }
  printf("]\n");
  free(pids);
  free(info);
  free(selected);
  return 0;
}
