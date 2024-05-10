An overview of the implemented Interest Rate Model [can be found here](https://docs.abax.finance/lending/interest-rate-model)

#Time weighted utilization rate

To make the Interest Rate adjustment mechanism resistant to the manipulation of the utilization rate, the Time-Weighted Utilization Rate is used.
Time-weighed Utilization Rate snapshots are taken upon reserve action/triggering accumulate_interest. They're being stored in a cyclic group of entries, where each entry contains the timestamp and the accumulator. The accumulator is the sum of the product of the utilization rate and the time delta between the current and the previous snapshot. The time-weighted utilization rate is calculated by dividing the difference between the current accumulator and the previous accumulator by the difference between the current timestamp and the previous timestamp.

Upon calling `adjust_rate_at_target` the Time-Weighted Utilization Rate entry with the shortest period longer than the minimal time between adjustments is retrieved. The Interest Rate Model is then adjusted to the target rate based on the Time-Weighted Utilization Rate.
