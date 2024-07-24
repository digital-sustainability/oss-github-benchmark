# Visit our website!

https://ossbenchmark.com

## Crawler: How does it work?

We have two different services:
- The DataService
- The CrawlerService

The CrawlerService startsup each hour and makes 5000 calls to the github api, saving everything in timestamped files.

The DataService also starts each hour. It loads all the crawled files from the last hour and saves all the data to the database. So the saved data is around one hour old when it is saved.

There can be 3 different states for the CrawlerService: no data, partial data, full data.

### No data state

**Start:** If there is no data in the database besides the *todoInstitutions*.

The Crawler just starts with the first Institution that it gets. When an organisation is finished, it gets a timestamp in the *todoInstiution* collection. When a whole instituion is finished it also gets a timestamp in the collection. 
The crawler skips all organisations and institutions which timestamps are younger than 7 Days.

### Partial data state

**Start:** If there are already some crawled institutions and organisations

The crawler gets the next institution and/or organisation that was never crawled or which timestamps are older than 7 days.
It may happen that 7 Days are not enougth to crawl all data, so there may be some re-crawls of already crawled repos before new ones are crawled.

### Full data state

**Start:** All institutions and organisations were already crawled at least once.

The crawler will just update the data, starting with the oldest timestamp.


## System Diagram

![System Diagram](/assets/images/SystemDiagram.png)

## Database Stucture

![System Diagram](/assets/images/DBStructure.png)

## Update Institutions (read also Contributing.md)

Once someone has updated the github_repos.md  file and the pull request was merged, the new or updated insitution must be added to the database using the Input Mask for new Institutions. This Input Mask is protected.

