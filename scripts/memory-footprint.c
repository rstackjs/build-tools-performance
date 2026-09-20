// macOS process-tree snapshot. Run outside the measured process group.
#include <errno.h>
#include <inttypes.h>
#include <libproc.h>
#include <stdio.h>
#include <stdlib.h>
#include <sys/resource.h>
#include <sys/proc.h>

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
    if (!selected[i] || info[i].pbi_status == SZOMB) continue;
    rusage_info_current usage = {0};
    if (proc_pid_rusage(pids[i], RUSAGE_INFO_CURRENT, (rusage_info_t *)&usage)) {
      // A process can exit between enumeration and measurement. macOS may
      // return EPERM after exit teardown changes its credentials, not just ESRCH.
      int error = errno;
      if (error == ESRCH) continue;
      struct proc_bsdinfo current = {0};
      int size = proc_pidinfo(pids[i], PROC_PIDTBSDINFO, 0, &current, sizeof(current));
      if (size == 0 && errno == ESRCH) continue;
      if (size == sizeof(current) &&
          (current.pbi_status == SZOMB || (current.pbi_flags & PROC_FLAG_INEXIT) ||
           current.pbi_start_tvsec != info[i].pbi_start_tvsec ||
           current.pbi_start_tvusec != info[i].pbi_start_tvusec)) continue;
      // Do not silently undercount an inaccessible process that is still alive.
      errno = error;
      fprintf(stderr, "proc_pid_rusage(%d), status=%u flags=0x%x: ",
              pids[i], current.pbi_status, current.pbi_flags);
      perror(NULL);
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
