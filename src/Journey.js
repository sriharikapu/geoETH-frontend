import React, { Component, Fragment } from 'react'
import { withStyles } from '@material-ui/core'
import { IconButton } from '@material-ui/core'
import { Checkbox, Divider } from '@material-ui/core'
import { ListSubheader, List, ListItem, ListItemText, ListItemSecondaryAction } from '@material-ui/core'
import { Check as CheckIcon } from '@material-ui/icons';
import GoogleMapReact from 'google-map-react'
import Geolocation from 'react-geolocation';
import { withWeb3 } from 'web3-webpacked-react';

import Message from './Message';
import Marker from './Marker'
import LocationMarker from './LocationMarker'
import ScanSecret from './ScanSecret'
import MakeClaim from './MakeClaim'

import dotenv from 'dotenv'
dotenv.config()

const styles = theme => ({
  map: {
    height: '50vh',
    width:  '100%'
  },
  found: {
    color: 'green'
  }
})

class Journey extends Component {
  constructor(props) {
    super(props)

    this.state = {
      mapCenter: this.props.center,
      currentPosition: undefined,
      zoom: 11,
      pinnedCache: {},
      currentSecrets: [],
    }

  }

  addSecret = (id, secret) => {
    if (!this.isFound(id)) {
      this.setState(oldState => {
        return {currentSecrets: oldState.currentSecrets.concat([{id: id, secret: secret}])}
      })
    }
  }

  reduceCache(cache) {
    return JSON.stringify(cache.lat, cache.lng)
  }

  handleCacheSelect = (cache) => {
    if (Object.keys(this.state.pinnedCache).length === 0 || this.state.pinnedCache !== cache) {
      this.setState({
        mapCenter: [cache.lat, cache.lng],
        zoom: 13,
        pinnedCache: cache
      })
    } else {
      this.restoreDefault()
    }
  }

  restoreDefault = () => {
    this.setState({
      mapCenter: this.props.center,
      zoom: 11,
      pinnedCache: {}
    })
  }

  handleCacheHover = (cache) => {
    if (Object.keys(this.state.pinnedCache).length !== 0) {
      return
    }

    if (cache === undefined) {
      this.restoreDefault()
      return
    }

    this.setState({
      mapCenter: [cache.lat, cache.lng],
      zoom: 13
    })
  }

  isFound = (i) => {
    return this.state.currentSecrets.map(secret => secret.id).includes(i)
  }

  render() {
    const { classes } = this.props

    const remainingSecrets = this.props.caches.length - this.state.currentSecrets.length

    return (
      <Fragment>
        <div className={classes.map}>
          <GoogleMapReact
            bootstrapURLKeys={{ key: 'AIzaSyAEAN2ts0SFThbcb-5RN0VKZXb8AHZVu24' }}
            center={this.state.mapCenter}
            zoom={this.state.zoom}
          >
            <Geolocation onSuccess={position => this.setState({currentPosition: position})} />
            {this.state.currentPosition ?
              <LocationMarker
                lat={this.state.currentPosition.coords.latitude}
                lng={this.state.currentPosition.coords.longitude}
              /> :
              undefined
            }

            {this.props.caches.map((cache, i) => {
              return (
                <Marker
                  key={this.reduceCache(cache)}
                  lat={cache.lat}
                  lng={cache.lng}
                  text={`${i}: ${cache.hint}`}
                  found={this.isFound(i)}
                  handleCacheSelect={this.isFound(i) ? undefined : this.handleCacheSelect}
                  cache={cache}
                />
              )
            })}
          </GoogleMapReact>
        </div>

        <ScanSecret addSecret={this.addSecret} />

        <List component="nav" subheader={
          <ListSubheader>
            {`${remainingSecrets} Remaining Secret${remainingSecrets > 1 ? 's' : ''}`}
          </ListSubheader>
        }>
          {this.props.caches.map((cache, i) => {
            if (this.isFound(i)) {
              return undefined
            }

            return (
              <ListItem
                button
                key={this.reduceCache(cache)}
                selected={this.reduceCache(this.state.pinnedCache) === this.reduceCache(cache)}
                onClick={() => this.handleCacheSelect(cache)}
                onMouseEnter={() => this.handleCacheHover(cache)}
                onMouseLeave={() => this.handleCacheHover()}
              >
                <ListItemText primary={`Cache ${i}`} secondary={cache.hint} />
                <ListItemSecondaryAction>
                  <Checkbox
                    checked={this.reduceCache(this.state.pinnedCache) === this.reduceCache(cache)}
                    onClick={() => this.handleCacheSelect(cache)}
                  />
                </ListItemSecondaryAction>
              </ListItem>
            )
          })}
        </List>

        {this.state.currentSecrets.length > 0 ?
          <Fragment>

            <Divider />
            <List component="nav" subheader={<ListSubheader>Found Secrets</ListSubheader>}>
              {this.props.caches.map((cache, i) => {
                if (!this.isFound(i)) {
                  return undefined
                }

                return (
                  <ListItem
                    button
                    key={this.reduceCache(cache)}
                    onMouseEnter={() => this.handleCacheHover(cache)}
                    onMouseLeave={() => this.handleCacheHover()}
                  >
                    <ListItemText primary={`Cache ${i}`} secondary={cache.hint} />
                    <ListItemSecondaryAction>
                      <IconButton disabled>
                        <CheckIcon className={classes.found} />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                )
              })}
            </List>
          </Fragment> :
          undefined
        }

        {remainingSecrets === 0 ?
          <MakeClaim address={this.props.address} secrets={this.state.currentSecrets} /> :
          undefined
        }

        <Message user={this.props.w3w.account} journey={this.props.name}/>
      </Fragment>
    )
  }
}

export default withStyles(styles)(withWeb3(Journey))
