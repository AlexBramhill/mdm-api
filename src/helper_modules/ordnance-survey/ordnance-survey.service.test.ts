import { HttpService } from '@nestjs/axios';
import { RandomValueGenerator } from '@ukef-test/support/generator/random-value-generator';
import { AxiosError } from 'axios';
import { when } from 'jest-when';
import { of, throwError } from 'rxjs';

import { OrdnanceSurveyException } from './exception/ordnance-survey.exception';
import { OrdnanceSurveyService } from './ordnance-survey.service';
import { ConfigService } from '@nestjs/config';

const expectedResponse = require('./examples/example-response-for-search-places-v1-postcode.json');
const noResultsResponse = require('./examples/example-response-for-search-places-v1-postcode.json');

describe('OrdnanceSurveyService', () => {
  const valueGenerator = new RandomValueGenerator();

  let httpServiceGet: jest.Mock;
  let configServiceGet: jest.Mock;
  let service: OrdnanceSurveyService;

  const testPostcode = 'W1A 1AA';
  const testKey = valueGenerator.string({length: 10});
  const basePath = '/search/places/v1/postcode';

  beforeEach(() => {
    const httpService = new HttpService();
    const configService = new ConfigService();
    httpServiceGet = jest.fn();
    httpService.get = httpServiceGet;

    configServiceGet = jest.fn().mockReturnValue({key: testKey});
    configService.get = configServiceGet;

    service = new OrdnanceSurveyService(httpService, configService);
  });



  describe('getAddressesByPostcode', () => {
    const expectedPath = `${basePath}?postcode=${testPostcode}&key=${testKey}`;

    const expectedHttpServiceGetArgs: [string, object] = [expectedPath, { headers: { 'Content-Type': 'application/json' } }];

    it('sends a GET to the Ordnance Survey API /search endpoint with the specified request', async () => {
      when(httpServiceGet)
        .calledWith(...expectedHttpServiceGetArgs)
        .mockReturnValueOnce(
          of({
            data: expectedResponse,
            status: 200,
            statusText: 'OK',
            config: undefined,
            headers: undefined,
          }),
        );

      await service.getAddressesByPostcode(testPostcode);

      expect(httpServiceGet).toHaveBeenCalledTimes(1);
      expect(httpServiceGet).toHaveBeenCalledWith(...expectedHttpServiceGetArgs);
    });

    it.each([
      {
        postcode: 'W1A 1AA',
        expectedUrlQueryPart: `?postcode=W1A%201AA`,
      },
      {
        postcode: 'W1A1AA',
        expectedUrlQueryPart: '?postcode=W1A1AA',
      },
    ])('call Ordnance Survey API with correct and safe query parameters "$expectedUrlQueryPart"', async ({ postcode, expectedUrlQueryPart }) => {
      // const expectedPath = `${basePath}${expectedUrlQueryPart}&key=${testKey}`;

      // const expectedHttpServiceGetArgs: [string, object] = [expectedPath, { headers: { 'Content-Type': 'application/json' } }];

      when(httpServiceGet)
        .calledWith(...expectedHttpServiceGetArgs)
        .mockReturnValueOnce(
          of({
            data: expectedResponse,
            status: 200,
            statusText: 'OK',
            config: undefined,
            headers: undefined,
          }),
        );

      await service.getAddressesByPostcode(testPostcode);

      expect(httpServiceGet).toHaveBeenCalledTimes(1);
      expect(httpServiceGet).toHaveBeenCalledWith(...expectedHttpServiceGetArgs);
    });

    it("no results - returns 200 without results", async () => {
      when(httpServiceGet)
        .calledWith(...expectedHttpServiceGetArgs)
        .mockReturnValueOnce(
          of({
            data: noResultsResponse,
            status: 200,
            statusText: 'OK',
            config: undefined,
            headers: undefined,
          }),
        );

      const results = await service.getAddressesByPostcode(testPostcode);

      expect(httpServiceGet).toHaveBeenCalledTimes(1);
      expect(httpServiceGet).toHaveBeenCalledWith(...expectedHttpServiceGetArgs);
      expect(results).toBe(noResultsResponse);
    });

    it('throws an OrdnanceSurveyException if the request to Ordnance Survey fails', async () => {
      const axiosRequestError = new AxiosError();
      when(httpServiceGet)
        .calledWith(...expectedHttpServiceGetArgs)
        .mockReturnValueOnce(throwError(() => axiosRequestError));

      const getCustomersPromise = service.getAddressesByPostcode(testPostcode);

      await expect(getCustomersPromise).rejects.toBeInstanceOf(OrdnanceSurveyException);
      await expect(getCustomersPromise).rejects.toThrow('Failed to get response from Ordnance Survey API.');
      await expect(getCustomersPromise).rejects.toHaveProperty('innerError', axiosRequestError);
    });
  });
});
