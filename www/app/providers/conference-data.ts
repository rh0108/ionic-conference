import {Injectable} from 'angular2/angular2';
import {Http} from 'angular2/http';
import {UserData} from './user-data';


@Injectable()
export class ConferenceData {

  constructor(http: Http, user: UserData) {
    // inject the Http provider and set to this instance
    this.http = http;
    this.user = user;
  }

  load() {
    if (this.data) {
      // already loaded data
      return Promise.resolve(this.data);
    }

    // don't have the data yet
    return new Promise(resolve => {
      // We're using Angular Http provider to request the data,
      // then on the response it'll map the JSON data to a parsed JS object.
      // Next we process the data and resolve the promise with the new data.
      this.http.get('app/data/data.json').subscribe(res => {
        // we've got back the raw data, now generate the core schedule data
        // and save the data for later reference
        this.data = this.processData(res.json());
        resolve(this.data);
      });
    });
  }

  processData(data) {
    // just some good 'ol JS fun with objects and arrays
    // build up the data by linking speakers to sessions

    data.tracks = [];

    // loop through each day in the schedule
    data.schedule.forEach(day => {
      // loop through each timeline group in the day
      day.groups.forEach(group => {
        // loop through each session in the timeline group
        group.sessions.forEach(session => {
          this.processSession(data, session);
        });
      });
    });

    return data;
  }

  processSession(data, session) {
    // loop through each speaker and load the speaker data
    // using the speaker name as the key
    session.speakers = [];
    if (session.speakerNames) {
      session.speakerNames.forEach(speakerName => {
        let speaker = data.speakers.find(s => s.name === speakerName);
        if (speaker) {
          session.speakers.push(speaker);
          speaker.sessions = speaker.sessions || [];
          speaker.sessions.push(session);
        }
      });
    }

    if (session.tracks) {
      session.tracks.forEach(track => {
        if (data.tracks.indexOf(track) < 0) {
          data.tracks.push(track);
        }
      });
    }
  }

  getTimeline(dayIndex, queryText='', tracks=[], segment='all') {
    return this.load().then(data => {
      let day = data.schedule[dayIndex];
      day.hasSessions = false;

      let queryWords = [];
      queryText = queryText.toLowerCase().replace(/,/g,' ').replace(/\./g,' ').replace(/-/g,' ');
      queryText.split(' ').forEach(queryWord => {
        queryWord = queryWord.trim();
        if (queryWord.length > 1) {
          queryWords.push(queryWord);
        }
      });

      let hasFilter = !!(queryWords.length || tracks.length || segment !== 'all');

      function queryFilter(session, name) {
        name = name.toLowerCase().trim();
        queryWords.forEach(queryWord => {
          if (name.indexOf(queryWord) > -1) {
            session.show = true;
          }
        })
      }

      day.groups.forEach(group => {
        group.show = false;

        group.sessions.forEach(session => {
          session.show = !hasFilter;

          if (hasFilter) {

            if (queryWords.length) {
              queryFilter(session, session.name);

              session.tracks.forEach(trackName => {
                queryFilter(session, trackName);
              });

              session.speakers.forEach(speaker => {
                queryFilter(session, speaker.name);
              });
            }

            if (tracks.length) {
              tracks.forEach(trackId => {
                if (session.tracks.indexOf(trackId) > -1) {
                  session.show = true;
                }
              });
            }

            if (segment === 'favorites') {
              if (this.user.hasFavorite(session.name)) {
                session.show = true;
              }
            }

          }

          if (session.show) {
            group.show = true;
          }
        });

        if (group.show) {
          day.hasSessions = true;
        }
      });

      return day;
    });
  }

  getSpeakers() {
    return this.load().then(data => {
      return data.speakers.sort((a, b) => {
        let aName = a.name.split(' ').pop();
        let bName = b.name.split(' ').pop();
        return aName.localeCompare(bName);
      });
    });
  }

  getTracks() {
    return this.load().then(data => {
      return data.tracks.sort();
    });
  }

  getMap() {
    return this.load().then(data => {
      return data.map;
    });
  }

}