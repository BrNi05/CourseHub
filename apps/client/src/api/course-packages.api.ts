import {
  create4 as createCoursePackageRequest,
  findMine as findMyCoursePackagesRequest,
  findOne3 as findCoursePackageByIdRequest,
  markAsUsed as markCoursePackageAsUsedRequest,
  remove3 as deleteCoursePackageRequest,
  search2 as searchCoursePackagesRequest,
  update6 as updateCoursePackageRequest,
  type CoursePackage,
  type CreateCoursePackageDto,
  type UpdateCoursePackageDto,
} from '@coursehub/sdk';

import { apiOptions } from './api';

export type CoursePackageSearchFilters = {
  universityId: string;
  facultyId: string;
  nameQuery: string;
};

export async function fetchMyCoursePackages(): Promise<CoursePackage[]> {
  const response = await findMyCoursePackagesRequest(apiOptions());
  return response.data;
}

export async function searchCoursePackages(
  filters: CoursePackageSearchFilters
): Promise<CoursePackage[]> {
  const response = await searchCoursePackagesRequest({
    ...apiOptions(),
    query: {
      universityId: filters.universityId || undefined,
      facultyId: filters.facultyId || undefined,
      nameQuery: filters.nameQuery.trim() || undefined,
    },
  });

  return response.data;
}

export async function fetchCoursePackageById(id: string): Promise<CoursePackage> {
  const response = await findCoursePackageByIdRequest({
    ...apiOptions(),
    path: { id },
  });

  return response.data;
}

export async function createCoursePackage(payload: CreateCoursePackageDto): Promise<CoursePackage> {
  const response = await createCoursePackageRequest({
    ...apiOptions(),
    body: payload,
  });

  return response.data;
}

export async function updateCoursePackage(
  id: string,
  payload: UpdateCoursePackageDto
): Promise<CoursePackage> {
  const response = await updateCoursePackageRequest({
    ...apiOptions(),
    body: payload,
    path: { id },
  });

  return response.data;
}

export async function deleteCoursePackage(id: string): Promise<void> {
  await deleteCoursePackageRequest({
    ...apiOptions(),
    path: { id },
  });
}

export async function markCoursePackageAsUsed(id: string): Promise<void> {
  await markCoursePackageAsUsedRequest({
    ...apiOptions(),
    path: { id },
  });
}
