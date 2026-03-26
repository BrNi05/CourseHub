/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, beforeEach, expect, vi } from 'vitest';
import { SuggestionController } from './suggestion.controller.js';
import type { CreateSuggestionDto } from './dto/create-suggestion.dto.js';
import type { UpdateSuggestionDto } from './dto/update-suggestion.dto.js';
import type { SuggestedCourse } from './entity/suggestion.entity.js';
import type { Course } from '../course/entity/course.entity.js';

describe('SuggestionController', () => {
  let controller: SuggestionController;
  let service: any;

  beforeEach(() => {
    service = {
      findAll: vi.fn(),
      suggest: vi.fn(),
      accept: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };

    controller = new SuggestionController(service);
  });

  describe('findAll', () => {
    it('should return all suggestions', async () => {
      const suggestions: SuggestedCourse[] = [
        {
          id: 's1',
          createdAt: new Date(),
          updatedAt: new Date(),
          courseName: 'Math',
          courseCode: 'BMECS101',
          facultyName: 'Science',
          facultyAbbrevName: 'SCI',
          uniName: 'Budapest University',
          uniAbbrevName: 'BME',
          userEmail: 'test@example.com',
        },
      ];

      service.findAll.mockResolvedValue(suggestions);

      const result = await controller.findAll();

      expect(service.findAll).toHaveBeenCalled();
      expect(result).toEqual(suggestions);
    });
  });

  describe('suggest', () => {
    it('should create a new suggestion', async () => {
      const userId = 'u1';
      const dto: CreateSuggestionDto = {
        courseName: 'Math',
        courseCode: 'BMECS101',
        facultyName: 'Science',
        facultyAbbrevName: 'SCI',
        uniName: 'Budapest University',
        uniAbbrevName: 'BME',
      };
      const created: SuggestedCourse = {
        id: 's1',
        createdAt: new Date(),
        updatedAt: new Date(),
        ...dto,
        userEmail: 'test@example.com',
      };

      service.suggest.mockResolvedValue(created);

      const result = await controller.suggest(userId, dto);

      expect(service.suggest).toHaveBeenCalledWith(userId, dto);
      expect(result).toEqual(created);
    });
  });

  describe('accept', () => {
    it('should accept a suggestion and return a course', async () => {
      const suggestionId = 's1';
      const course: Course = {
        id: 'c1',
        name: 'Math',
        code: 'BMECS101',
        facultyId: 'f1',
        createdAt: new Date(),
        updatedAt: new Date(),
        coursePageUrl: '',
        courseTadUrl: '',
        courseMoodleUrl: '',
        courseSubmissionUrl: '',
        courseTeamsUrl: '',
        courseExtraUrl: '',
      };

      service.accept.mockResolvedValue(course);

      const result = await controller.accept(suggestionId);

      expect(service.accept).toHaveBeenCalledWith(suggestionId);
      expect(result).toEqual(course);
    });
  });

  describe('update', () => {
    it('should update a suggestion', async () => {
      const suggestionId = 's1';
      const dto: UpdateSuggestionDto = { courseName: 'Math Updated' };
      const updated: SuggestedCourse = {
        id: 's1',
        createdAt: new Date(),
        updatedAt: new Date(),
        courseName: 'Math Updated',
        courseCode: 'BMECS101',
        facultyName: 'Science',
        facultyAbbrevName: 'SCI',
        uniName: 'Budapest University',
        uniAbbrevName: 'BME',
        userEmail: 'test@example.com',
      };

      service.update.mockResolvedValue(updated);

      const result = await controller.update(suggestionId, dto);

      expect(service.update).toHaveBeenCalledWith(suggestionId, dto);
      expect(result).toEqual(updated);
    });
  });

  describe('delete', () => {
    it('should delete a suggestion', async () => {
      const suggestionId = 's1';

      service.delete.mockResolvedValue(undefined);

      const result = await controller.delete(suggestionId);

      expect(service.delete).toHaveBeenCalledWith(suggestionId);
      expect(result).toBeUndefined();
    });
  });
});
