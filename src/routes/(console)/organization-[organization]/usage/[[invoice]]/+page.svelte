<script lang="ts">
    import { Container } from '$lib/layout';
    import { Card, CardGrid, Heading, ProgressBarBig } from '$lib/components';
    import {
        getServiceLimit,
        showUsageRatesModal,
        type Tier,
        upgradeURL
    } from '$lib/stores/billing';
    import { organization } from '$lib/stores/organization';
    import { Button } from '$lib/elements/forms';
    import { bytesToSize, humanFileSize, mbSecondsToGBHours } from '$lib/helpers/sizeConvertion';
    import { BarChart } from '$lib/charts';
    import ProjectBreakdown from './ProjectBreakdown.svelte';
    import { formatNum } from '$lib/helpers/string';
    import { accumulateFromEndingTotal, total } from '$lib/layout/usage.svelte';
    import type { OrganizationUsage } from '$lib/sdk/billing';
    import { BillingPlan } from '$lib/constants';
    import { trackEvent } from '$lib/actions/analytics';
    import TotalMembers from './totalMembers.svelte';

    export let data;

    const tier = data?.plan
        ? (data.plan.$id as Tier)
        : (data?.currentInvoice?.plan ?? $organization?.billingPlan);
    const plan = data?.plan ?? undefined;

    $: project = (data.organizationUsage as OrganizationUsage).projects;
</script>

<Container>
    <div class="u-flex u-cross-center u-main-space-between">
        <Heading tag="h2" size="5">Usage</Heading>

        {#if $organization?.billingPlan === BillingPlan.FREE}
            <Button
                href={$upgradeURL}
                on:click={() => {
                    trackEvent('click_organization_upgrade', {
                        from: 'button',
                        source: 'organization_usage'
                    });
                }}>
                <span class="text">Upgrade</span>
            </Button>
        {/if}
    </div>
    <div class="u-flex u-main-space-between common-section u-cross-center">
        {#if $organization.billingPlan === BillingPlan.SCALE}
            <p class="text">
                On the Scale plan, you'll be charged only for any usage that exceeds the thresholds
                per resource listed below. <button
                    on:click={() => ($showUsageRatesModal = true)}
                    class="link"
                    type="button">Learn more about plan usage limits.</button>
            </p>
        {:else if $organization.billingPlan === BillingPlan.PRO}
            <p class="text">
                On the Pro plan, you'll be charged only for any usage that exceeds the thresholds
                per resource listed below. <button
                    on:click={() => ($showUsageRatesModal = true)}
                    class="link"
                    type="button">Learn more about plan usage limits.</button>
            </p>
        {:else if $organization.billingPlan === BillingPlan.FREE}
            <p class="text">
                If you exceed the limits of the Free plan, services for your organization's projects
                may be disrupted.
                <a href={$upgradeURL} class="link">Upgrade for greater capacity</a>.
            </p>
        {/if}
    </div>

    <CardGrid>
        <Heading tag="h6" size="7">Bandwidth</Heading>

        <p class="text">
            Calculated for all bandwidth used across all projects in your organization. Resets at
            the start of each billing cycle.
        </p>

        <svelte:fragment slot="aside">
            {#if data.organizationUsage.bandwidth}
                {@const current = total(data.organizationUsage.bandwidth)}
                {@const currentHumanized = humanFileSize(current)}
                {@const max = getServiceLimit('bandwidth', tier, plan)}
                <ProgressBarBig
                    currentUnit={currentHumanized.unit}
                    currentValue={currentHumanized.value}
                    maxValue={`of ${max.toString()} GB used`}
                    progressValue={bytesToSize(current, 'GB')}
                    progressMax={max}
                    showBar={false} />
                <div style:margin-top="-1.5em">
                    <BarChart
                        options={{
                            yAxis: {
                                axisLabel: {
                                    formatter: (value) =>
                                        value
                                            ? `${humanFileSize(+value).value} ${
                                                  humanFileSize(+value).unit
                                              }`
                                            : '0'
                                }
                            }
                        }}
                        series={[
                            {
                                name: 'Bandwidth',
                                data: [
                                    ...data.organizationUsage.bandwidth.map((e) => [
                                        e.date,
                                        e.value
                                    ])
                                ],
                                tooltip: {
                                    valueFormatter: (value) =>
                                        `${humanFileSize(+value).value} ${humanFileSize(+value).unit}`
                                }
                            }
                        ]} />
                </div>
                {#if project?.length > 0}
                    <ProjectBreakdown projects={project} metric="bandwidth" {data} />
                {/if}
            {:else}
                <Card isDashed>
                    <div class="u-flex u-cross-center u-flex-vertical u-main-center u-flex">
                        <span
                            class="icon-chart-square-bar text-large"
                            aria-hidden="true"
                            style="font-size: 32px;" />
                        <p class="u-bold">No data to show</p>
                    </div>
                </Card>
            {/if}
        </svelte:fragment>
    </CardGrid>

    <CardGrid>
        <Heading tag="h6" size="7">Users</Heading>

        <p class="text">The total number of users across all projects in your organization.</p>

        <svelte:fragment slot="aside">
            {#if data.organizationUsage.users}
                {@const current = data.organizationUsage.usersTotal}
                {@const max = getServiceLimit('users', tier, plan)}
                <ProgressBarBig
                    currentUnit="Users"
                    currentValue={formatNum(current)}
                    maxUnit="users"
                    maxValue={`out of ${formatNum(max)}`}
                    progressValue={current}
                    progressMax={max}
                    showBar={false} />
                <div style:margin-top="-1.5em">
                    <BarChart
                        options={{
                            yAxis: {
                                axisLabel: {
                                    formatter: formatNum
                                }
                            }
                        }}
                        series={[
                            {
                                name: 'Users',
                                data: accumulateFromEndingTotal(
                                    data.organizationUsage.users,
                                    data.organizationUsage.usersTotal
                                )
                            }
                        ]} />
                </div>
                {#if project?.length > 0}
                    <ProjectBreakdown projects={project} metric="users" {data} />
                {/if}
            {:else}
                <Card isDashed>
                    <div class="u-flex u-cross-center u-flex-vertical u-main-center u-flex">
                        <span
                            class="icon-chart-square-bar text-large"
                            aria-hidden="true"
                            style="font-size: 32px;" />
                        <p class="u-bold">No data to show</p>
                    </div>
                </Card>
            {/if}
        </svelte:fragment>
    </CardGrid>

    <CardGrid>
        <Heading tag="h6" size="7">Executions</Heading>

        <p class="text">
            Calculated for all functions that are executed in all projects in your organization.
        </p>

        <svelte:fragment slot="aside">
            {#if data.organizationUsage.executionsTotal}
                {@const current = data.organizationUsage.executionsTotal}
                {@const max = getServiceLimit('executions', tier, plan)}
                <ProgressBarBig
                    currentUnit="Executions"
                    currentValue={formatNum(current)}
                    maxValue={`of ${formatNum(max)} executions used`}
                    progressValue={current}
                    progressMax={max}
                    showBar={false} />
                <div style:margin-top="-1.5em">
                    <BarChart
                        options={{
                            yAxis: {
                                axisLabel: {
                                    formatter: formatNum
                                }
                            }
                        }}
                        series={[
                            {
                                name: 'Executions',
                                data: [
                                    ...data.organizationUsage.executions.map((e) => [
                                        e.date,
                                        e.value
                                    ])
                                ]
                            }
                        ]} />
                </div>
                {#if project?.length > 0}
                    <ProjectBreakdown projects={project} metric="executions" {data} />
                {/if}
            {:else}
                <Card isDashed>
                    <div class="u-flex u-cross-center u-flex-vertical u-main-center u-flex">
                        <span
                            class="icon-chart-square-bar text-large"
                            aria-hidden="true"
                            style="font-size: 32px;" />
                        <p class="u-bold">No data to show</p>
                    </div>
                </Card>
            {/if}
        </svelte:fragment>
    </CardGrid>

    <CardGrid>
        <Heading tag="h6" size="7">Storage</Heading>

        <p class="text">
            Calculated for all your files, deployments, builds, databases and backups.
        </p>

        <svelte:fragment slot="aside">
            {#if data.organizationUsage.storageTotal}
                {@const current = data.organizationUsage.storageTotal}
                {@const currentHumanized = humanFileSize(current)}
                {@const max = getServiceLimit('storage', tier, plan)}
                {@const progressBarStorageDate = [
                    {
                        size: bytesToSize(data.organizationUsage.filesStorageTotal, 'GB'),
                        color: '#85DBD8',
                        tooltip: {
                            title: 'File storage',
                            label: `${Math.round(bytesToSize(data.organizationUsage.filesStorageTotal, 'GB') * 100) / 100}GB`
                        }
                    },
                    {
                        size: bytesToSize(data.organizationUsage.backupsStorageTotal, 'GB'),
                        color: '#68A3FE',
                        tooltip: {
                            title: 'Backups storage',
                            label: `${Math.round(bytesToSize(data.organizationUsage.backupsStorageTotal, 'GB') * 100) / 100}MB`
                        }
                    },
                    {
                        size: bytesToSize(data.organizationUsage.deploymentsStorageTotal, 'GB'),
                        color: '#7C67FE',
                        tooltip: {
                            title: 'Deployments storage',
                            label: `${Math.round(bytesToSize(data.organizationUsage.deploymentsStorageTotal, 'GB') * 100) / 100}GB`
                        }
                    },
                    {
                        size: bytesToSize(data.organizationUsage.buildsStorageTotal, 'GB'),
                        color: '#FE9567',
                        tooltip: {
                            title: 'Builds storage',
                            label: `${Math.round(bytesToSize(data.organizationUsage.buildsStorageTotal, 'GB') * 100) / 100}GB`
                        }
                    }
                ]}
                <ProgressBarBig
                    currentUnit={currentHumanized.unit}
                    currentValue={currentHumanized.value}
                    maxValue={`of ${max.toString()} GB used`}
                    progressValue={bytesToSize(current, 'GB')}
                    progressMax={max}
                    progressBarData={progressBarStorageDate} />
                {#if project?.length > 0}
                    <ProjectBreakdown projects={project} metric="storage" {data} />
                {/if}
            {:else}
                <Card isDashed>
                    <div class="u-flex u-cross-center u-flex-vertical u-main-center u-flex">
                        <span
                            class="icon-chart-square-bar text-large"
                            aria-hidden="true"
                            style="font-size: 32px;" />
                        <p class="u-bold">No data to show</p>
                    </div>
                </Card>
            {/if}
        </svelte:fragment>
    </CardGrid>
    <CardGrid>
        <Heading tag="h6" size="7">GB hours</Heading>

        <p class="text">
            GB hours represent the memory usage (in gigabytes) of your function executions and
            builds, multiplied by the total execution time (in hours).
        </p>

        <svelte:fragment slot="aside">
            {#if data.organizationUsage.storageTotal}
                {@const totalGbHours = mbSecondsToGBHours(
                    data.organizationUsage.executionsMBSecondsTotal +
                        data.organizationUsage.buildsMBSecondsTotal
                )}
                {@const progressBarStorageDate = [
                    {
                        size: mbSecondsToGBHours(data.organizationUsage.executionsMBSecondsTotal),
                        color: '#85DBD8',
                        tooltip: {
                            title: 'Executions',
                            label: `${(Math.round(mbSecondsToGBHours(data.organizationUsage.executionsMBSecondsTotal) * 100) / 100).toLocaleString('en-US')} GB hours`
                        }
                    },
                    {
                        size: mbSecondsToGBHours(data.organizationUsage.buildsMBSecondsTotal),
                        color: '#FE9567',
                        tooltip: {
                            title: 'Deployments',
                            label: `${(Math.round(mbSecondsToGBHours(data.organizationUsage.buildsMBSecondsTotal) * 100) / 100).toLocaleString('en-US')} GB hours`
                        }
                    }
                ]}
                <div class="u-flex u-flex-vertical">
                    <div class="u-flex u-main-space-between">
                        <p>
                            <span class="heading-level-4"
                                >{(Math.ceil(totalGbHours * 100) / 100).toLocaleString(
                                    'en-US'
                                )}</span>
                            <span class="body-text-1 u-bold">{`GB hours`}</span>
                        </p>
                    </div>
                </div>
                <ProgressBarBig
                    progressMax={totalGbHours}
                    progressValue={totalGbHours}
                    progressBarData={progressBarStorageDate} />
            {:else}
                <Card isDashed>
                    <div class="u-flex u-cross-center u-flex-vertical u-main-center u-flex">
                        <span
                            class="icon-chart-square-bar text-large"
                            aria-hidden="true"
                            style="font-size: 32px;" />
                        <p class="u-bold">No data to show</p>
                    </div>
                </Card>
            {/if}
        </svelte:fragment>
    </CardGrid>
    <TotalMembers members={data?.organizationMembers} />

    <p class="text common-section u-color-text-gray">
        Metrics are estimates updated every 24 hours and may not accurately reflect your invoice.
    </p>
</Container>
