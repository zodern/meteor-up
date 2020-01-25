import chalk from 'chalk';

function withColor(color = 'reset', text) {
  if (!(color in chalk)) {
    console.log('unknown color', color, 'for text', text);
  }

  return chalk[color](text);
}

export function pickWorseColor(...colors) {
  if (colors.includes('red')) {
    return 'red';
  }
  if (colors.includes('yellow')) {
    return 'yellow';
  }
  if (colors.includes('green')) {
    return 'green';
  }

  return colors[0];
}

export function parseDockerInfo(dockerInfo) {
  const containerStatus = dockerInfo.State.Status;
  let statusColor = 'green';

  if (dockerInfo.State.Restarting) {
    statusColor = 'yellow';
  } else if (dockerInfo.State.Running !== true) {
    statusColor = 'red';
  }

  return {
    containerStatus,
    statusColor,
    upTime: new Date(dockerInfo.State.FinishedAt).getTime() -
      new Date(dockerInfo.Created).getTime(),
    restartCount: dockerInfo.RestartCount
  };
}

class Line {
  constructor(text, color, parent) {
    this.children = [];
    this.color = color;
    this.text = text;
    this.parent = parent;

    this.updateColor(color);
  }

  updateColor(color) {
    this.color = color;

    if (this.parent) {
      this.parent.updateChildColor(color);
    }
  }

  updateChildColor(color) {
    const newColor = pickWorseColor(this.color, color);
    this.updateColor(newColor);
  }

  addLine(text, color) {
    const line = new Line(text, color, this);
    this.children.push(line);

    return line;
  }

  display(overview, depth) {
    let show = true;
    if (overview) {
      show = depth === 0 || this.color && this.color !== 'green';
    }

    if (show) {
      const spaces = '  '.repeat(depth);
      console.log(withColor(this.color, `${spaces}${this.text}`));
    }

    this.children.forEach(child => {
      child.display(overview, depth + 1);
    });
  }
}

export class StatusDisplay {
  constructor(title) {
    this.overallColor = 'green';
    this.tree = [];
    this.title = title;
    this.rootLine = new Line(`=> ${title}`, this.overallColor);
  }

  addLine(text, color) {
    return this.rootLine.addLine(text, color);
  }

  show(overview) {
    // show empty line to separate from any other status information
    console.log('');
    this.rootLine.display(overview, 0);
  }
}
