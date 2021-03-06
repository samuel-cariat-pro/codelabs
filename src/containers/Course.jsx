import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import urlJoin from 'url-join';

import Splash from '../components/Splash';

import {
  loadCourses,
  loadStep,
} from '../actions';
import { NOOP } from '../constants';

import componentFactory from '../services/componentFactory';

const mapStateToProps = ({ courses, currentStepMD }) => ({ courses, currentStepMD });
const mapDispatchToProps = { loadCourses, loadStep };

export class Course extends React.Component {
  static propTypes = {
    course: PropTypes.shape(),
    loadCourses: PropTypes.func,
    loadStep: PropTypes.func,
  };

  state = {
    steps: [],
    currentStep: 0,
  }

  constructor(props) {
    super(props);

    this.loadInternalStep = this.loadInternalStep.bind(this);
    this.previous = this.previous.bind(this);
    this.next = this.next.bind(this);
    this.go = this.go.bind(this);
  }

  async componentDidMount() {
    let {
      course,
      match: {
        params: { lang, permalink },
      },
    } = this.props;

    if (!course) {
      await this.props.loadCourses();

      course = this.props.courses.find(
        post => post.permalink === `/${lang}/${permalink}/`
      );
    }

    this.setState({ course }, async () => {
      await this.loadInternalStep(0);

      this.setState({
        steps: {
          index: componentFactory(this.props.currentStepMD),
        },
      });
    });
  }

  componentWillReceiveProps(nextProps) {
    const { currentStepMD } = nextProps;
    const { steps, currentStep } = this.state;

    if (currentStepMD) {
      this.setState({
        steps: {
          ...steps,
          [`step${currentStep}`]: componentFactory(currentStepMD),
        },
      });
    }
  }

  loadInternalStep(stepIndex) {
    const { course } = this.state;

    let { match: { params: { permalink } } } = this.props;
    const step = stepIndex <= 0 ? 'index' : `step${stepIndex}`;

    return this.props.loadStep(`${course.date}-${permalink}/${step}.md`);
  }

  next() {
    this.go(1);
  }

  previous() {
    this.go(-1);
  }

  async go(direction) {
    const nextStep = this.state.currentStep + direction;

    this.setState({ currentStep: nextStep }, () => {
      this.loadInternalStep(nextStep);
    });
  }

  render() {
    const { course = {}, currentStep } = this.state;
    const {
      steps: {
        [currentStep === 0 ? 'index' : `step${currentStep}`]: step = [],
      } = {},
    } = this.state;

    return (
      <div className="home container">
        <div>
          <button
            onClick={this.previous}
            disabled={currentStep === 0}
          >previous</button>

          <button
            onClick={this.next}
            disabled={currentStep === course.step_count}
            style={{ float: 'right' }}
          >next</button>
        </div>

        <div className="post-content">
          {step.map((renderer, key) => renderer({ key }))}
        </div>
      </div>
    );
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(Course);
