import { ScullyConfig } from '@scullyio/scully';
// @ts-ignore
export const config: ScullyConfig = {
  projectRoot: './src',
  projectName: 'oss-github-benchmark',
  outDir: './dist/static',
  routes: {
    '/institutions/:institution': {
      type: 'json',
      institution: {
        url: 'https://oss-benchmark-backend.fdn.iwi.unibe.ch/institutions',
        resultsHandler: (response) => {
          console.log(response);
          return response.institutions;
        },
        property: 'shortname',
      },
    },
  }
};
