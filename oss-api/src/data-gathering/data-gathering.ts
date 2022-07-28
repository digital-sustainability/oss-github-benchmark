import { spawn } from 'child_process';

export class DataGathering {
  public async startScript() {
    const pythonProcess = spawn('python3', [
      './src/data-gathering/OSS_github_benchmark.py',
    ]);
    pythonProcess.stdout.on('data', function (data) {
      console.log(data.toString());
    });
  }
}
