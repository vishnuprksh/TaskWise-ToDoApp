import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  StatusBar,
  Modal,
  ScrollView,
  Alert,
  Animated,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Plus,
  Trash2,
  CheckCircle2,
  Circle,
  LayoutList,
  X,
  Edit2,
  Tag,
  Flag,
  ChevronDown,
  ChevronUp,
  Briefcase,
  Archive,
  Search,
} from 'lucide-react-native';

const STORAGE_KEY_TASKS = '@taskwise_tasks';
const STORAGE_KEY_PROJECTS = '@taskwise_projects';

const PRIORITY_WEIGHTS = {
  size: 0.4,
  importance: 0.3,
  emergency: 0.2,
  interest: 0.1,
};

const ATTRIBUTE_VALUES = {
  low: 1,
  medium: 2,
  high: 3,
};

const DEFAULT_PROJECTS = [
  { id: '1', name: 'Personal', color: '#3b82f6', archived: false },
  { id: '2', name: 'Work', color: '#10b981', archived: false },
  { id: '3', name: 'Shopping', color: '#f59e0b', archived: false },
];

const calculatePriorityScore = (attrs) => {
  if (!attrs) return 0;
  try {
    const size = ATTRIBUTE_VALUES[attrs.size] || 1;
    const importance = ATTRIBUTE_VALUES[attrs.importance] || 1;
    const emergency = ATTRIBUTE_VALUES[attrs.emergency] || 1;
    const interest = ATTRIBUTE_VALUES[attrs.interest] || 1;

    const score =
      size * PRIORITY_WEIGHTS.size +
      importance * PRIORITY_WEIGHTS.importance +
      emergency * PRIORITY_WEIGHTS.emergency +
      interest * PRIORITY_WEIGHTS.interest;

    if (isNaN(score)) return 0;
    return parseFloat(score.toFixed(2));
  } catch (e) {
    console.error('Error calculating priority', e);
    return 0;
  }
};

export default function App() {
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [isTaskModalVisible, setIsTaskModalVisible] = useState(false);
  const [isProjectModalVisible, setIsProjectModalVisible] = useState(false);
  const [projectSearchText, setProjectSearchText] = useState('');

  // Task Form State
  const [editingTask, setEditingTask] = useState(null);
  const [taskText, setTaskText] = useState('');
  const [selectedProject, setSelectedProject] = useState(null);
  const [attributes, setAttributes] = useState({
    size: 'medium',
    importance: 'medium',
    emergency: 'medium',
    interest: 'medium',
  });

  // Project Form State
  const [projectName, setProjectName] = useState('');
  const [projectColor, setProjectColor] = useState('#3b82f6');
  const [editingProject, setEditingProject] = useState(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadData();
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  }, []);

  const loadData = async () => {
    try {
      const savedTasks = await AsyncStorage.getItem(STORAGE_KEY_TASKS);
      const savedProjects = await AsyncStorage.getItem(STORAGE_KEY_PROJECTS);

      if (savedTasks) {
        let parsedTasks = JSON.parse(savedTasks);
        // Migration for old tasks
        parsedTasks = parsedTasks.map(task => {
          if (!task.attributes || task.priorityScore === undefined) {
            const defaultAttributes = {
              size: 'medium',
              importance: 'medium',
              emergency: 'medium',
              interest: 'medium',
            };
            return {
              ...task,
              attributes: task.attributes || defaultAttributes,
              priorityScore: task.priorityScore !== undefined ? task.priorityScore : calculatePriorityScore(defaultAttributes),
              projectId: task.projectId || null
            };
          }
          return task;
        });
        setTasks(parsedTasks);
      }

      if (savedProjects) {
        setProjects(JSON.parse(savedProjects));
      } else {
        setProjects(DEFAULT_PROJECTS);
        saveProjects(DEFAULT_PROJECTS);
      }
    } catch (error) {
      console.error('Failed to load data', error);
    }
  };

  const saveTasks = async (newTasks) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY_TASKS, JSON.stringify(newTasks));
    } catch (error) {
      console.error('Failed to save tasks', error);
    }
  };

  const saveProjects = async (newProjects) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY_PROJECTS, JSON.stringify(newProjects));
    } catch (error) {
      console.error('Failed to save projects', error);
    }
  };


  const handleSaveTask = () => {
    if (taskText.trim().length === 0) return;

    const priorityScore = calculatePriorityScore(attributes);
    const newTask = {
      id: editingTask ? editingTask.id : Date.now().toString(),
      text: taskText,
      completed: editingTask ? editingTask.completed : false,
      projectId: selectedProject,
      attributes,
      priorityScore,
    };

    let newTasks;
    if (editingTask) {
      newTasks = tasks.map((t) => (t.id === editingTask.id ? newTask : t));
    } else {
      newTasks = [...tasks, newTask];
    }

    // Sort by priority score (descending)
    newTasks.sort((a, b) => b.priorityScore - a.priorityScore);

    setTasks(newTasks);
    saveTasks(newTasks);
    closeTaskModal();
  };

  const deleteTask = (id) => {
    const newTasks = tasks.filter((item) => item.id !== id);
    setTasks(newTasks);
    saveTasks(newTasks);
  };

  const toggleTask = (id) => {
    const newTasks = tasks.map((item) =>
      item.id === id ? { ...item, completed: !item.completed } : item
    );
    setTasks(newTasks);
    saveTasks(newTasks);
  };

  const openTaskModal = (task = null) => {
    if (task) {
      setEditingTask(task);
      setTaskText(task.text);
      setSelectedProject(task.projectId);
      setAttributes(task.attributes);
    } else {
      setEditingTask(null);
      setTaskText('');
      setSelectedProject(projects.length > 0 ? projects[0].id : null);
      setProjectSearchText('');
      setAttributes({
        size: 'medium',
        importance: 'medium',
        emergency: 'medium',
        interest: 'medium',
      });
    }
    setIsTaskModalVisible(true);
  };

  const closeTaskModal = () => {
    setIsTaskModalVisible(false);
    Keyboard.dismiss();
  };

  const handleSaveProject = () => {
    if (projectName.trim().length === 0) return;

    const newProject = {
      id: editingProject ? editingProject.id : Date.now().toString(),
      name: projectName,
      color: projectColor,
      archived: editingProject ? editingProject.archived : false,
    };

    let newProjects;
    if (editingProject) {
      newProjects = projects.map((p) => (p.id === editingProject.id ? newProject : p));
    } else {
      newProjects = [...projects, newProject];
    }

    setProjects(newProjects);
    saveProjects(newProjects);
    closeProjectModal();
  };

  const deleteProject = (id) => {
    Alert.alert(
      "Delete Project",
      "Are you sure? Tasks in this project will remain but lose their project tag.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            const newProjects = projects.filter((p) => p.id !== id);
            setProjects(newProjects);
            saveProjects(newProjects);

            // Update tasks to remove project reference
            const newTasks = tasks.map(t => t.projectId === id ? { ...t, projectId: null } : t);
            setTasks(newTasks);
            saveTasks(newTasks);
          }
        }
      ]
    );
  };

  const toggleProjectArchive = (id) => {
    const newProjects = projects.map((p) =>
      p.id === id ? { ...p, archived: !p.archived } : p
    );
    setProjects(newProjects);
    saveProjects(newProjects);
  };

  const openProjectModal = (project = null) => {
    if (project) {
      setEditingProject(project);
      setProjectName(project.name);
      setProjectColor(project.color);
    } else {
      setEditingProject(null);
      setProjectName('');
      setProjectColor('#3b82f6');
    }
    setIsProjectModalVisible(true);
  };

  const closeProjectModal = () => {
    setIsProjectModalVisible(false);
    Keyboard.dismiss();
  };

  const getProject = (id) => projects.find((p) => p.id === id);

  const AttributeSelector = ({ label, value, onChange }) => (
    <View style={styles.attributeRow}>
      <Text style={styles.attributeLabel}>{label}</Text>
      <View style={styles.attributeOptions}>
        {['low', 'medium', 'high'].map((option) => (
          <TouchableOpacity
            key={option}
            style={[
              styles.attributeOption,
              value === option && styles.attributeOptionSelected,
              value === option && { backgroundColor: getAttributeColor(option) },
            ]}
            onPress={() => onChange(option)}
          >
            <Text
              style={[
                styles.attributeOptionText,
                value === option && styles.attributeOptionTextSelected,
              ]}
            >
              {option.charAt(0).toUpperCase() + option.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const getAttributeColor = (value) => {
    switch (value) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#10b981';
      default: return '#64748b';
    }
  };

  const renderTaskItem = ({ item }) => {
    const project = getProject(item.projectId);
    return (
      <Animated.View style={[styles.taskContainer, { opacity: fadeAnim }]}>
        <View style={styles.taskMain}>
          <TouchableOpacity
            style={styles.taskTextContainer}
            onPress={() => toggleTask(item.id)}
          >
            {item.completed ? (
              <CheckCircle2 size={24} color="#10b981" />
            ) : (
              <Circle size={24} color="#94a3b8" />
            )}
            <View style={styles.taskContent}>
              <Text style={[styles.taskText, item.completed && styles.completedTaskText]}>
                {item.text}
              </Text>
              <View style={styles.taskMeta}>
                {project && (
                  <View style={[styles.projectTag, { backgroundColor: project.color + '20' }]}>
                    <View style={[styles.projectDot, { backgroundColor: project.color }]} />
                    <Text style={[styles.projectTagText, { color: project.color }]}>
                      {project.name}
                    </Text>
                  </View>
                )}
                <View style={styles.priorityTag}>
                  <Flag size={12} color="#f59e0b" />
                  <Text style={styles.priorityText}>
                    {typeof item.priorityScore === 'number' ? item.priorityScore.toFixed(1) : '0.0'}
                  </Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>
          <View style={styles.taskActions}>
            <TouchableOpacity onPress={() => openTaskModal(item)} style={styles.actionButton}>
              <Edit2 size={20} color="#64748b" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => deleteTask(item.id)} style={styles.actionButton}>
              <Trash2 size={20} color="#ef4444" />
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
    );
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" />

        {/* Header */}
        <View style={styles.header}>
          <View>
            <View style={styles.titleContainer}>
              <LayoutList size={32} color="#6366f1" />
              <Text style={styles.title}>TaskWise</Text>
            </View>
            <Text style={styles.subtitle}>Stay organized, stay ahead.</Text>
          </View>
          <TouchableOpacity onPress={() => setIsProjectModalVisible(true)} style={styles.projectsButton}>
            <Briefcase size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Task List */}
        <FlatList
          data={tasks.filter(t => {
            const project = getProject(t.projectId);
            return !project || !project.archived;
          })}
          renderItem={renderTaskItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No tasks yet. Add one below!</Text>
            </View>
          }
        />

        {/* Add Task FAB */}
        <TouchableOpacity
          style={styles.fab}
          onPress={() => openTaskModal()}
        >
          <Plus size={32} color="#fff" />
        </TouchableOpacity>

        {/* Task Modal */}
        <Modal
          visible={isTaskModalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={closeTaskModal}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalOverlay}
          >
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{editingTask ? 'Edit Task' : 'New Task'}</Text>
                <TouchableOpacity onPress={closeTaskModal}>
                  <X size={24} color="#94a3b8" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalBody}>
                <Text style={styles.inputLabel}>Task Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="What needs to be done?"
                  placeholderTextColor="#64748b"
                  value={taskText}
                  onChangeText={setTaskText}
                />

                <Text style={styles.inputLabel}>Project</Text>

                {/* Project Search */}
                <View style={styles.searchContainer}>
                  <Search size={16} color="#94a3b8" style={styles.searchIcon} />
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Search projects..."
                    placeholderTextColor="#64748b"
                    value={projectSearchText}
                    onChangeText={setProjectSearchText}
                  />
                </View>

                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.projectSelector}>
                  {projects
                    .filter(p => !p.archived && p.name.toLowerCase().includes(projectSearchText.toLowerCase()))
                    .map((project) => (
                      <TouchableOpacity
                        key={project.id}
                        style={[
                          styles.projectOption,
                          selectedProject === project.id && { backgroundColor: project.color, borderColor: project.color },
                        ]}
                        onPress={() => setSelectedProject(project.id)}
                      >
                        <Text
                          style={[
                            styles.projectOptionText,
                            selectedProject === project.id && { color: '#fff' },
                          ]}
                        >
                          {project.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                </ScrollView>

                <View style={styles.divider} />

                <Text style={styles.sectionTitle}>Priority Attributes</Text>
                <AttributeSelector
                  label="Size (40%)"
                  value={attributes.size}
                  onChange={(val) => setAttributes({ ...attributes, size: val })}
                />
                <AttributeSelector
                  label="Importance (30%)"
                  value={attributes.importance}
                  onChange={(val) => setAttributes({ ...attributes, importance: val })}
                />
                <AttributeSelector
                  label="Emergency (20%)"
                  value={attributes.emergency}
                  onChange={(val) => setAttributes({ ...attributes, emergency: val })}
                />
                <AttributeSelector
                  label="Interest (10%)"
                  value={attributes.interest}
                  onChange={(val) => setAttributes({ ...attributes, interest: val })}
                />
              </ScrollView>

              <TouchableOpacity style={styles.saveButton} onPress={handleSaveTask}>
                <Text style={styles.saveButtonText}>Save Task</Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </Modal>

        {/* Projects Modal */}
        <Modal
          visible={isProjectModalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setIsProjectModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Manage Projects</Text>
                <TouchableOpacity onPress={() => setIsProjectModalVisible(false)}>
                  <X size={24} color="#94a3b8" />
                </TouchableOpacity>
              </View>

              <View style={styles.projectForm}>
                <TextInput
                  style={[styles.input, { marginBottom: 10 }]}
                  placeholder="Project Name"
                  placeholderTextColor="#64748b"
                  value={projectName}
                  onChangeText={setProjectName}
                />
                <View style={styles.colorSelector}>
                  {['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'].map((color) => (
                    <TouchableOpacity
                      key={color}
                      style={[
                        styles.colorOption,
                        { backgroundColor: color },
                        projectColor === color && styles.colorOptionSelected,
                      ]}
                      onPress={() => setProjectColor(color)}
                    />
                  ))}
                </View>
                <TouchableOpacity style={styles.addProjectButton} onPress={handleSaveProject}>
                  <Text style={styles.addProjectButtonText}>
                    {editingProject ? 'Update Project' : 'Add Project'}
                  </Text>
                </TouchableOpacity>
              </View>

              <FlatList
                data={projects}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <View style={styles.projectListItem}>
                    <View style={styles.projectListInfo}>
                      <View style={[styles.projectDot, { backgroundColor: item.color }]} />
                      <Text style={styles.projectListText}>{item.name}</Text>
                    </View>
                    <View style={styles.projectListActions}>
                      <TouchableOpacity onPress={() => toggleProjectArchive(item.id)} style={{ marginRight: 15 }}>
                        <Archive size={18} color={item.archived ? "#f59e0b" : "#64748b"} />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => openProjectModal(item)}>
                        <Edit2 size={18} color="#64748b" />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => deleteProject(item.id)} style={{ marginLeft: 15 }}>
                        <Trash2 size={18} color="#ef4444" />
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
                style={styles.projectList}
              />
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#f8fafc',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: '#94a3b8',
    marginTop: 4,
    fontWeight: '500',
  },
  projectsButton: {
    backgroundColor: '#334155',
    padding: 10,
    borderRadius: 12,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  taskContainer: {
    backgroundColor: '#1e293b',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  taskMain: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  taskTextContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
    gap: 12,
  },
  taskContent: {
    flex: 1,
  },
  taskText: {
    fontSize: 16,
    color: '#f1f5f9',
    fontWeight: '500',
    marginBottom: 6,
  },
  completedTaskText: {
    textDecorationLine: 'line-through',
    color: '#64748b',
  },
  taskMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  projectTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 6,
  },
  projectDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  projectTagText: {
    fontSize: 12,
    fontWeight: '600',
  },
  priorityTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f59e0b20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  priorityText: {
    color: '#f59e0b',
    fontSize: 12,
    fontWeight: '700',
  },
  taskActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginLeft: 8,
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    width: 60,
    height: 60,
    backgroundColor: '#6366f1',
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1e293b',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#f8fafc',
  },
  modalBody: {
    marginBottom: 20,
  },
  inputLabel: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    backgroundColor: '#0f172a',
    padding: 16,
    borderRadius: 12,
    color: '#f8fafc',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: '#f8fafc',
    fontSize: 14,
    paddingVertical: 12,
  },
  projectSelector: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  projectOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#334155',
    marginRight: 8,
    backgroundColor: '#0f172a',
  },
  projectOptionText: {
    color: '#94a3b8',
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#334155',
    marginVertical: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: 16,
  },
  attributeRow: {
    marginBottom: 16,
  },
  attributeLabel: {
    color: '#94a3b8',
    fontSize: 14,
    marginBottom: 8,
  },
  attributeOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  attributeOption: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
  },
  attributeOptionSelected: {
    borderColor: 'transparent',
  },
  attributeOptionText: {
    color: '#94a3b8',
    fontWeight: '600',
    fontSize: 12,
  },
  attributeOptionTextSelected: {
    color: '#fff',
  },
  saveButton: {
    backgroundColor: '#6366f1',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  // Project Modal Styles
  projectForm: {
    marginBottom: 20,
  },
  colorSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  colorOption: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorOptionSelected: {
    borderColor: '#fff',
  },
  addProjectButton: {
    backgroundColor: '#3b82f6',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  addProjectButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  projectList: {
    maxHeight: 300,
  },
  projectListItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  projectListInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  projectListText: {
    color: '#f8fafc',
    fontSize: 16,
  },
  projectListActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  emptyState: {
    marginTop: 100,
    alignItems: 'center',
  },
  emptyStateText: {
    color: '#64748b',
    fontSize: 16,
    fontWeight: '500',
  },
});
