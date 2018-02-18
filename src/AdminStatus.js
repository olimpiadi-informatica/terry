export default class AdminStatus {
  constructor(data) {
    this.data = data;
  }

  extraTimeMinutes() {
    return Math.round(this.data.extra_time / 60)
  }
}
