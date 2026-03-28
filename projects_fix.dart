    66	                  child: projectsAsync.when(
    67	                    data: (projects) {
    68	                      return FutureBuilder(
    69	                        future: ref.watch(tasksProvider.future),
    70	                        builder: (context, snapshot) {
    71	                          if (snapshot.hasData) {
    72	                            final tasks = snapshot.data!;
    73	                            return ListView.builder(
    74	                              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 10),
    75	                              itemCount: projects.length,
    76	                              itemBuilder: (context, index) {
    77	                                final project = projects[index];
    78	                                final totalTime = tasks
    79	                                    .where((t) => t.projectId == project.id)
    80	                                    .fold(0, (sum, t) => sum + (t.timeSpent));
    81	
    82	                                return Padding(
    83	                                  padding: const EdgeInsets.only(bottom: 16),
    84	                                  child: ProjectItem(
    85	                                    project: project,
    86	                                    totalTime: totalTime,
    87	                                    onEdit: () => _showProjectForm(context, project: project),
    88	                                    onToggleArchive: () {
    89	                                      ref.read(firestoreServiceProvider).updateProject(project.id, {
    90	                                        'archived': !project.archived,
    91	                                      });
    92	                                    },
    93	                                    onDelete: () => _confirmDelete(context, ref, project.id),
    94	                                  ),
    95	                                );
    96	                              }, ); } );
    97	                            );
    98	                          } else if (snapshot.hasError) {
    99	                            return Center(child: Text('Error: ${snapshot.error}', style: const TextStyle(color: Colors.white)));
   100	                          } else {
   101	                            return Center(child: CircularProgressIndicator());
   102	                          }
   103	                        },
   104	                      );
   105	                    },
   106	                    loading: () => Center(child: CircularProgressIndicator()),
   107	                    error: (err, _) => Center(child: Text('Error: $err', style: const TextStyle(color: Colors.white))),
   108	              ],
   109	            ),
   110	          ),
   111	        ),
   112	      ),
   113	    );
   114	  }
   115	
