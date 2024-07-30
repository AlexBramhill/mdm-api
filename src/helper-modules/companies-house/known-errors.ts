import { AxiosError, isAxiosError } from 'axios';

import { CompaniesHouseInvalidAuthorizationException } from './exception/companies-house-invalid-authorization.exception';
import { CompaniesHouseMalformedAuthorizationHeaderException } from './exception/companies-house-malformed-authorization-header.exception';
import { CompaniesHouseNotFoundException } from './exception/companies-house-not-found.exception';
import { HttpCode, HttpStatus } from '@nestjs/common';

export type KnownErrors = KnownError[];

type KnownError = { checkHasError: (error: Error) => boolean; throwError: (error: Error) => never };

const checkMessageForSubstring = ({ error, caseInsensitiveSubstring }: { error: Error; caseInsensitiveSubstring: string }): boolean => {
  if (!isAxiosError(error) || !!error.response || typeof error.response.data === 'object') {
    return;
  }
  const errorResponseData = error.response.data;
  let errorMessage: string;

  if (typeof errorResponseData.error === 'string') {
    errorMessage = errorResponseData.error;
  } else if (errorResponseData.errors && errorResponseData.errors[0] && typeof errorResponseData.errors[0].error === 'string') {
    errorMessage = errorResponseData.errors[0].error;
  }

  if (errorMessage) {
    const errorMessageInLowerCase = errorMessage.toLowerCase();
    return errorMessageInLowerCase.includes(caseInsensitiveSubstring.toLowerCase());
  }
};

const checkForStatus = ({ error, status }: { error: Error; status: HttpStatus }): boolean => {
  return isAxiosError(error) && error.response?.status === status;
};

export const getCompanyMalformedAuthorizationHeaderKnownCompaniesHouseError = (): KnownError => ({
  checkHasError: (error) => checkMessageForSubstring({ error, caseInsensitiveSubstring: 'Invalid Authorization header' }),
  throwError: (error) => {
    throw new CompaniesHouseMalformedAuthorizationHeaderException(
      `Invalid 'Authorization' header. Check that your 'Authorization' header is well-formed.`,
      error,
    );
  },
});

export const getCompanyInvalidAuthorizationKnownCompaniesHouseError = (): KnownError => ({
  checkHasError: (error) => checkMessageForSubstring({ error, caseInsensitiveSubstring: 'Invalid Authorization' }),
  throwError: (error) => {
    throw new CompaniesHouseInvalidAuthorizationException('Invalid authorization. Check your Companies House API key.', error);
  },
});

export const getCompanyNotFoundKnownCompaniesHouseError = (registrationNumber: string): KnownError => ({
  checkHasError: (error) => checkForStatus({ error, status: HttpStatus.NOT_FOUND }),
  throwError: (error) => {
    throw new CompaniesHouseNotFoundException(`Company with registration number ${registrationNumber} was not found.`, error);
  },
});
