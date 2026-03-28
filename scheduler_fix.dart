    97	                child: tasksAsync.when(
    98	                  data: (allTasks) {
    99	                      return FutureBuilder(
   100	                        future: ref.watch(projectsProvider.future),
   101	                        builder: (context, snapshot) {
   102	                          if (snapshot.hasData) {
   103	                            final projects = snapshot.data!;
   104	                            final schedulerService = ref.watch(schedulerServiceProvider);
   105	                            final tasksForDay = schedulerService.getTasksForDate(_currentDate, allTasks);
   106	                            final projectMap = {for (var p in projects) p.id: p};
   107	
   108	                            return _buildTimeline(tasksForDay, projectMap); ); } );
   109	                          } else if (snapshot.hasError) {
   110	                            return Center(child: Text('Error: ${snapshot.error}', style: const TextStyle(color: Colors.red)));
   111	                          } else {
   112	                            return Center(child: CircularProgressIndicator());
   113	                          }
   114	                        },
   115	                      );
   116	                    },
   117	                    loading: () => Center(child: CircularProgressIndicator()),
   118	                    error: (err, _) => Center(
   119	                      child: Text('Error loading tasks: $err', style: const TextStyle(color: Colors.red)),
   120	                    ),
   121	              ],
   122	            ),
   123	          ),
   124	        ),
   125	      ),
   126	    );
   127	  }
   128	
   129	  Widget _buildHeader() {
   130	    return Padding(
