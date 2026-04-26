<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch, watchEffect } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import BaseButton from '@/components/BaseButton.vue';
import ConfirmDialog from '@/components/ConfirmDialog.vue';
import CoursePackageCard from '@/components/CoursePackageCard.vue';
import CoursePackageEditorDialog from '@/components/CoursePackageEditorDialog.vue';
import CoursePackageShareDialog from '@/components/CoursePackageShareDialog.vue';
import { fetchFacultiesByUniversity } from '@/api/faculties.api';
import {
  createCoursePackage,
  deleteCoursePackage,
  fetchCoursePackageById,
  fetchMyCoursePackages,
  markCoursePackageAsUsed,
  searchCoursePackages,
  updateCoursePackage,
} from '@/api/course-packages.api';
import { rememberRouteIntent } from '@/router/routing-manager';
import { appLifecycleState } from '@/stores/app-bootstrap';
import { useAppStore } from '@/stores/composables/use-app-store';
import { authState } from '@/stores/modules/auth.store';
import { coursesState } from '@/stores/modules/courses.store';

import type {
  Course,
  CoursePackage,
  CreateCoursePackageDto,
  FacultyWithoutCoursesDto,
} from '@coursehub/sdk';

const app = useAppStore();
const route = useRoute();
const router = useRouter();

const myPackages = ref<CoursePackage[]>([]);
const searchResults = ref<CoursePackage[]>([]);
const loadingMine = ref(false);
const searching = ref(false);
const hasSearched = ref(false);
const saving = ref(false);
const usingPackageId = ref('');
const deletingPackageId = ref('');
const editorOpen = ref(false);
const packageToEdit = ref<CoursePackage | null>(null);
const packageToShare = ref<CoursePackage | null>(null);
const packageToDelete = ref<CoursePackage | null>(null);
const packageToUse = ref<CoursePackage | null>(null);
const useDialogOpen = ref(false);
const loadingSharedPackage = ref(false);
const lastLoadedSharedPackageId = ref('');

const searchForm = reactive({
  universityId: '',
  facultyId: '',
  nameQuery: '',
});

const appInitialized = ref(false);
const sessionUserId = ref<string | null>(null);
const selectedCourseIds = ref<Set<string>>(new Set());
const searchFaculties = ref<FacultyWithoutCoursesDto[]>([]);
const loadingSearchFaculties = ref(false);
let searchFacultyRequestId = 0;

const editorCourses = computed<Course[]>(() => {
  const courses = new Map<string, Course>();

  for (const course of coursesState.selectedCourses) {
    courses.set(course.id, course);
  }

  for (const course of packageToEdit.value?.courses ?? []) {
    courses.set(course.id, course);
  }

  return [...courses.values()];
});

const sharedPackageId = computed<string>(() => {
  const value = route.query.package;
  return typeof value === 'string' ? value : '';
});

const pageBusy = computed<boolean>(
  () => saving.value || loadingMine.value || loadingSharedPackage.value
);

function getMissingCourseCount(packageItem: CoursePackage): number {
  return (packageItem.courses ?? []).filter((course) => !selectedCourseIds.value.has(course.id))
    .length;
}

function upsertPackageInList(list: CoursePackage[], nextPackage: CoursePackage): CoursePackage[] {
  const nextEntries = new Map(list.map((entry) => [entry.id, entry]));
  nextEntries.set(nextPackage.id, nextPackage);

  return [...nextEntries.values()].sort(
    (left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime()
  );
}

function removePackageFromList(list: CoursePackage[], packageId: string): CoursePackage[] {
  return list.filter((entry) => entry.id !== packageId);
}

async function loadMine() {
  if (!app.isAuthenticated()) return;

  loadingMine.value = true;

  try {
    myPackages.value = await fetchMyCoursePackages();
  } catch (error) {
    app.notify(
      'danger',
      'Nem sikerült betölteni a csomagjaidat',
      error instanceof Error ? error.message : 'Próbáld meg később újra.'
    );
  } finally {
    loadingMine.value = false;
  }
}

function loginToContinue() {
  if (sharedPackageId.value) rememberRouteIntent(route.fullPath);
  app.loginWithGoogle();
}

async function submitSearch() {
  if (!app.isAuthenticated()) {
    app.notify('info', 'Bejelentkezés szükséges', 'A csomagkereséshez jelentkezz be.');
    return;
  }

  searching.value = true;
  hasSearched.value = true;

  try {
    searchResults.value = await searchCoursePackages(searchForm);
  } catch (error) {
    app.notify(
      'danger',
      'Nem sikerült keresni a csomagok között',
      error instanceof Error ? error.message : 'Próbáld meg később újra.'
    );
  } finally {
    searching.value = false;
  }
}

async function loadSearchFaculties(universityId: string) {
  searchFacultyRequestId += 1;
  const requestId = searchFacultyRequestId;

  if (!universityId) {
    searchFaculties.value = [];
    loadingSearchFaculties.value = false;
    return;
  }

  loadingSearchFaculties.value = true;

  try {
    const faculties = await fetchFacultiesByUniversity(universityId);
    if (requestId !== searchFacultyRequestId) return;

    searchFaculties.value = faculties;
  } catch (error) {
    if (requestId !== searchFacultyRequestId) return;

    searchFaculties.value = [];
    app.notify(
      'danger',
      'Nem sikerült betölteni a karokat',
      error instanceof Error ? error.message : 'Próbáld meg később újra.'
    );
  } finally {
    if (requestId === searchFacultyRequestId) {
      loadingSearchFaculties.value = false;
    }
  }
}

function openCreateDialog() {
  packageToEdit.value = null;
  editorOpen.value = true;
}

function openEditDialog(packageItem: CoursePackage) {
  packageToEdit.value = packageItem;
  editorOpen.value = true;
}

async function savePackage(payload: CreateCoursePackageDto) {
  saving.value = true;
  const isEditing = Boolean(packageToEdit.value);

  try {
    const savedPackage = packageToEdit.value
      ? await updateCoursePackage(packageToEdit.value.id, payload)
      : await createCoursePackage(payload);

    myPackages.value = upsertPackageInList(myPackages.value, savedPackage);
    const nextSearchResults: CoursePackage[] = [];

    for (const entry of searchResults.value) {
      nextSearchResults.push(entry.id === savedPackage.id ? savedPackage : entry);
    }

    searchResults.value = nextSearchResults;

    editorOpen.value = false;
    packageToEdit.value = null;

    app.notify(
      'success',
      isEditing ? 'Csomag frissítve' : 'Csomag létrehozva',
      `A(z) ${savedPackage.name} csomag létrehozva.`
    );
  } catch {
    // TODO: cant use toast here
  } finally {
    saving.value = false;
  }
}

function openShareDialog(packageItem: CoursePackage) {
  packageToShare.value = packageItem;
}

function requestDeletePackage(packageItem: CoursePackage) {
  packageToDelete.value = packageItem;
}

async function confirmDeletePackage() {
  if (!packageToDelete.value) return;

  deletingPackageId.value = packageToDelete.value.id;

  try {
    await deleteCoursePackage(packageToDelete.value.id);
    myPackages.value = removePackageFromList(myPackages.value, packageToDelete.value.id);
    searchResults.value = removePackageFromList(searchResults.value, packageToDelete.value.id);

    app.notify(
      'success',
      'Csomag törölve',
      `A(z) ${packageToDelete.value.name} csomagot töröltük.`
    );
    packageToDelete.value = null;
  } catch (error) {
    app.notify(
      'danger',
      'Nem sikerült törölni a csomagot',
      error instanceof Error ? error.message : 'Próbáld meg később újra.'
    );
  } finally {
    deletingPackageId.value = '';
  }
}

function openUseDialog(packageItem: CoursePackage) {
  packageToUse.value = packageItem;
  useDialogOpen.value = true;
}

function closeShareDialog() {
  packageToShare.value = null;
}

function closeDeleteDialog() {
  packageToDelete.value = null;
}

function handleShareDialogVisibility(nextValue: boolean) {
  if (!nextValue) closeShareDialog();
}

function handleDeleteDialogVisibility(nextValue: boolean) {
  if (!nextValue) closeDeleteDialog();
}

async function clearSharedPackageQuery() {
  if (!sharedPackageId.value) return;

  const nextQuery = { ...route.query };
  delete nextQuery.package;
  await router.replace({ query: nextQuery });
}

async function closeUseDialog() {
  useDialogOpen.value = false;
  packageToUse.value = null;
  lastLoadedSharedPackageId.value = '';
  await clearSharedPackageQuery();
}

async function confirmUsePackage() {
  if (!packageToUse.value) return;

  usingPackageId.value = packageToUse.value.id;

  try {
    await app.addCourses(packageToUse.value.courses ?? []);
    await closeUseDialog();
  } catch (error) {
    app.notify(
      'danger',
      'Nem sikerült felvenni a csomagot',
      error instanceof Error ? error.message : 'Próbáld meg később újra.'
    );
  } finally {
    usingPackageId.value = '';
  }
}

async function handleUseDialogVisibility(nextValue: boolean) {
  if (nextValue) {
    useDialogOpen.value = true;
    return;
  }

  await closeUseDialog();
}

async function loadSharedPackageFromQuery(packageId: string) {
  if (!packageId || !app.isAuthenticated()) return;
  if (lastLoadedSharedPackageId.value === packageId && useDialogOpen.value) return;

  loadingSharedPackage.value = true;

  try {
    const packageItem = await fetchCoursePackageById(packageId);
    packageToUse.value = packageItem;
    useDialogOpen.value = true;
    lastLoadedSharedPackageId.value = packageId;

    try {
      await markCoursePackageAsUsed(packageId);
    } catch {
      // Do not handle
    }
  } catch (error) {
    app.notify(
      'danger',
      'Nem sikerült betölteni a megosztott csomagot',
      error instanceof Error ? error.message : 'Lehet, hogy a link már nem érvényes.'
    );
    await clearSharedPackageQuery();
  } finally {
    loadingSharedPackage.value = false;
  }
}

watchEffect(() => {
  appInitialized.value = appLifecycleState.initialized;
  sessionUserId.value = authState.session.userId;
  selectedCourseIds.value = new Set(
    coursesState.selectedCourses.map((course: Course) => course.id)
  );
});

watch(
  () => [sharedPackageId.value, sessionUserId.value] as const,
  ([packageId, userId]) => {
    if (!packageId || userId) return;
    rememberRouteIntent(route.fullPath);
  },
  { immediate: true }
);

watch(
  appInitialized,
  (initialized) => {
    if (!initialized) return;
    void app.loadUniversities();
  },
  { immediate: true }
);

watch(
  () => [appInitialized.value, sessionUserId.value] as const,
  ([initialized, userId]) => {
    if (!initialized || !userId) {
      myPackages.value = [];
      return;
    }
    void loadMine();
  },
  { immediate: true }
);

watch(
  () => searchForm.universityId,
  (universityId) => {
    searchForm.facultyId = '';
    void loadSearchFaculties(universityId);
  },
  { immediate: true }
);

watch(
  () => [appInitialized.value, sessionUserId.value, sharedPackageId.value] as const,
  ([initialized, userId, packageId]) => {
    if (!initialized || !userId || !packageId) return;
    void loadSharedPackageFromQuery(packageId);
  },
  { immediate: true }
);

onMounted(() => {
  void app.loadUniversities();
});
</script>

<template>
  <section class="packages-page">
    <div class="packages-page__hero">
      <div class="packages-page__hero-copy">
        <h1>Csomagjaim</h1>
        <p class="packages-page__lede">
          Hozz létre tárgycsomagokat, majd oszd meg linkkel vagy QR-kóddal.
        </p>
      </div>

      <div class="packages-page__hero-actions">
        <BaseButton
          :disabled="!app.isAuthenticated() || pageBusy"
          kind="primary"
          @click="openCreateDialog"
        >
          Új csomag
        </BaseButton>
      </div>
    </div>

    <div v-if="!app.isAuthenticated()" class="packages-page__gate">
      <h2>Bejelentkezés szükséges</h2>
      <p>
        A csomagok létrehozása, keresése és felvétele csak bejelentkezett felhasználóknak érhető el.
      </p>

      <BaseButton :disabled="app.state.loginInFlight" kind="primary" @click="loginToContinue">
        {{ app.state.loginInFlight ? 'Átirányítás...' : 'Bejelentkezés' }}
      </BaseButton>
    </div>

    <div v-else class="packages-layout">
      <section class="packages-panel">
        <div class="packages-panel__header">
          <div>
            <h2>Csomagkeresés</h2>
          </div>
        </div>

        <form class="search-panel" @submit.prevent="submitSearch">
          <label class="field">
            <span>Egyetem</span>
            <select v-model="searchForm.universityId" :disabled="app.state.loadingUniversities">
              <option value="">Összes egyetem</option>
              <option
                v-for="university in app.state.universities"
                :key="university.id"
                :value="university.id"
              >
                {{ university.name }} ({{ university.abbrevName }})
              </option>
            </select>
          </label>

          <label class="field">
            <span>Kar</span>
            <select
              v-model="searchForm.facultyId"
              :disabled="!searchForm.universityId || loadingSearchFaculties"
            >
              <option value="">
                {{
                  searchForm.universityId
                    ? loadingSearchFaculties
                      ? 'Karok betöltése...'
                      : 'Összes kar'
                    : 'Előbb válassz egyetemet'
                }}
              </option>
              <option v-for="faculty in searchFaculties" :key="faculty.id" :value="faculty.id">
                {{ faculty.name }}
              </option>
            </select>
          </label>

          <label class="field">
            <span>Csomag neve</span>
            <input
              v-model="searchForm.nameQuery"
              placeholder="Biomérnök BSc 2. félév"
              type="text"
            />
          </label>

          <BaseButton
            :disabled="searching || app.state.loadingUniversities || loadingSearchFaculties"
            kind="secondary"
            type="submit"
          >
            {{ searching ? 'Keresés...' : 'Keresés' }}
          </BaseButton>
        </form>

        <div v-if="searchResults.length > 0" class="package-grid">
          <CoursePackageCard
            v-for="packageItem in searchResults"
            :key="packageItem.id"
            :action-busy="usingPackageId === packageItem.id"
            :action-disabled="getMissingCourseCount(packageItem) === 0"
            :action-label="
              getMissingCourseCount(packageItem) === 0
                ? 'Már felvett tárgyak'
                : `${getMissingCourseCount(packageItem)} tárgy felvétele`
            "
            :package-item="packageItem"
            mode="search"
            @share="openShareDialog"
            @use="openUseDialog"
          />
        </div>

        <div v-else class="packages-panel__empty">
          <h3>{{ hasSearched ? 'Nincs találat' : 'Kereshető csomagok' }}</h3>
          <p>
            {{
              hasSearched
                ? 'Próbálj meg másik egyetemet, kart vagy rövidebb névrészletet megadni.'
                : 'Keress egyetem, kar vagy csomagnév alapján, vagy nyiss meg egy megosztott linket.'
            }}
          </p>
        </div>
      </section>

      <section class="packages-panel">
        <div class="packages-panel__header">
          <div>
            <h2>Saját csomagok</h2>
          </div>

          <span class="packages-panel__badge">{{ myPackages.length }} csomag</span>
        </div>

        <div v-if="loadingMine" class="packages-panel__empty">
          <h3>Betöltés...</h3>
          <p>A csomagok lekérése folyamatban van.</p>
        </div>

        <div v-else-if="myPackages.length > 0" class="package-grid">
          <CoursePackageCard
            v-for="packageItem in myPackages"
            :key="packageItem.id"
            :action-busy="saving && packageToEdit?.id === packageItem.id"
            :delete-busy="deletingPackageId === packageItem.id"
            :package-item="packageItem"
            mode="mine"
            @edit="openEditDialog"
            @remove="requestDeletePackage"
            @share="openShareDialog"
          />
        </div>

        <div v-else class="packages-panel__empty">
          <h3>Még nincs csomagod</h3>
          <p>
            Jelölj meg tárgyakat a főoldalon vagy a keresőben, majd állíts össze belőlük egy
            megosztható csomagot.
          </p>
        </div>
      </section>
    </div>

    <CoursePackageEditorDialog
      v-model="editorOpen"
      :available-courses="editorCourses"
      :busy="saving"
      :package-item="packageToEdit"
      @submit="savePackage"
    />

    <CoursePackageShareDialog
      :model-value="packageToShare !== null"
      :package-item="packageToShare"
      @update:model-value="handleShareDialogVisibility"
    />

    <ConfirmDialog
      :busy="deletingPackageId.length > 0"
      :description="
        packageToDelete
          ? `A(z) ${packageToDelete.name} csomagot végleg töröljük.`
          : 'A csomagot végleg töröljük.'
      "
      :model-value="packageToDelete !== null"
      cancel-label="Mégse"
      confirm-kind="danger"
      confirm-label="Törlés"
      title="Csomag törlése"
      width="md"
      @back="closeDeleteDialog"
      @confirm="confirmDeletePackage"
      @update:model-value="handleDeleteDialogVisibility"
    />

    <ConfirmDialog
      :busy="usingPackageId.length > 0"
      :description="packageToUse ? `A csomag tárgyait hozzáadjuk a felvett tárgyaidhoz.` : ''"
      :model-value="useDialogOpen"
      cancel-label="Mégse"
      confirm-kind="primary"
      confirm-label="Tárgyak felvétele"
      title="Csomag felvétele"
      width="md"
      @back="closeUseDialog"
      @confirm="confirmUsePackage"
      @update:model-value="handleUseDialogVisibility"
    >
      <div v-if="packageToUse" class="confirm-package">
        <strong>{{ packageToUse.name }}</strong>
        <p>
          {{ packageToUse.courses?.length ?? 0 }} tárgyból
          {{ getMissingCourseCount(packageToUse) }} új kerül felvételre.
        </p>
      </div>
    </ConfirmDialog>
  </section>
</template>

<style scoped>
.packages-page {
  display: grid;
  gap: 1.6rem;
}

.packages-page__gate,
.packages-panel,
.packages-panel__empty,
.search-panel {
  display: grid;
  gap: 0.9rem;
}

.packages-page__hero {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: 1.5rem;
  padding-top: 1.2rem;
}

.packages-page__hero-copy {
  display: grid;
  gap: 0.9rem;
  flex: 1 1 450px;
}

.packages-page h1,
.packages-panel h2,
.packages-panel__empty h3,
.packages-page__gate h2,
.confirm-package p,
.confirm-package strong {
  margin: 0;
}

.packages-page__lede,
.packages-page__gate p,
.packages-panel__empty p {
  color: var(--text-muted);
  line-height: 1.6;
  margin: 0;
}

.packages-page__hero-actions {
  display: flex;
  flex: 0 0 auto;
}

.packages-page__gate,
.packages-panel {
  backdrop-filter: blur(18px);
  background: var(--surface-elevated);
  border: 1px solid var(--border-soft);
  border-radius: 1.6rem;
  box-shadow: var(--shadow-large);
  padding: 1.2rem;
}

.packages-layout {
  display: grid;
  gap: 1rem;
}

.packages-panel__header {
  align-items: center;
  display: flex;
  gap: 0.8rem;
  justify-content: space-between;
}

.packages-panel__badge {
  background: rgba(59, 130, 246, 0.16);
  border-radius: 999px;
  color: #dbeafe;
  display: inline-flex;
  font-size: 0.82rem;
  font-weight: 700;
  padding: 0.55rem 0.8rem;
}

.search-panel {
  align-items: end;
}

.search-panel > :last-child {
  margin: 0.32rem 0;
  min-width: 7.5rem;
  justify-content: center;
}

.field {
  display: grid;
  gap: 0.45rem;
}

.field span {
  color: var(--text-muted);
  font-size: 0.88rem;
}

.field input,
.field select {
  background: var(--field-surface);
  border: 1px solid var(--border-soft);
  border-radius: 1rem;
  color: var(--text-primary);
  font: inherit;
  min-height: 3rem;
  padding: 0 0.95rem;
  width: 100%;
}

.package-grid {
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(auto-fit, minmax(17rem, 1fr));
}

.confirm-package {
  display: grid;
  gap: 0.75rem;
  margin: 0.55rem 0 0.35rem;
  padding: 0 0 0.35rem 0.45rem;
}

.confirm-package strong {
  color: var(--text-primary);
}

.confirm-package p {
  color: var(--text-muted);
  line-height: 1.5;
}

@media (min-width: 960px) {
  .packages-page__hero {
    flex-wrap: nowrap;
  }

  .packages-page__hero-actions {
    justify-content: flex-end;
  }

  .search-panel {
    grid-template-columns: minmax(0, 1.15fr) minmax(0, 1fr) minmax(0, 1fr) auto;
  }

  .search-panel > :last-child {
    margin: 0;
    min-width: 7.5rem;
  }

  .search-panel + .package-grid {
    margin-top: 0.3rem;
  }
}
</style>
