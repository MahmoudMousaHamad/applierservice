export class IUserData {
	answers: any;

	titles: any;

	locations: any;

	jobType: any;

	experienceLevel: any;

	coverLetter: any;

	userId: any;

	set(data: any) {
		if (data.titles &&
			data.locations &&
			data.jobType &&
			data.experienceLevel &&
			data.coverLetter &&
			data.userId) {
				this.experienceLevel = data.experienceLevel;
				this.coverLetter = data.coverLetter;
				this.locations = data.locations;
				this.jobType = data.jobType;
				this.titles = data.titles;
				this.userId = data.userId;
				return true;
			}
		return false;
	}
}

export const UserData = new IUserData();
