import { Octokit } from '@octokit/core';

export declare const GitHubOctokit: (new (...args: any[]) => {
  [x: string]: any;
}) & {
  new (...args: any[]): {
    [x: string]: any;
  };
  plugins: any[];
} & typeof Octokit &
  import('@octokit/core/dist-types/types').Constructor<
    import('@octokit/plugin-rest-endpoint-methods/dist-types/generated/method-types').RestEndpointMethods & {
      paginate: import('@octokit/plugin-paginate-rest').PaginateInterface;
    }
  >;
